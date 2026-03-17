import torch
import torch.nn as nn
import math
import ultralytics.utils.loss
import ultralytics.utils.metrics
import ultralytics.nn.tasks
import ultralytics.utils.tal

# ==============================================================================
# 1. WIoU (Wise-IoU) Implementation
# ==============================================================================

def bbox_iou(box1, box2, xywh=True, GIoU=False, DIoU=False, CIoU=False, WIoU=False, eps=1e-7):
    """
    Custom bbox_iou function with WIoU v1 support.
    """
    # Get the coordinates of bounding boxes
    if xywh:  # transform from xywh to xyxy
        (x1, y1, w1, h1), (x2, y2, w2, h2) = box1.chunk(4, -1), box2.chunk(4, -1)
        w1_, h1_, w2_, h2_ = w1 / 2, h1 / 2, w2 / 2, h2 / 2
        b1_x1, b1_x2, b1_y1, b1_y2 = x1 - w1_, x1 + w1_, y1 - h1_, y1 + h1_
        b2_x1, b2_x2, b2_y1, b2_y2 = x2 - w2_, x2 + w2_, y2 - h2_, y2 + h2_
    else:  # x1, y1, x2, y2 = box1
        b1_x1, b1_y1, b1_x2, b1_y2 = box1.chunk(4, -1)
        b2_x1, b2_y1, b2_x2, b2_y2 = box2.chunk(4, -1)
        w1, h1 = b1_x2 - b1_x1, b1_y2 - b1_y1 + eps
        w2, h2 = b2_x2 - b2_x1, b2_y2 - b2_y1 + eps

    # Intersection area
    inter = (b1_x2.minimum(b2_x2) - b1_x1.maximum(b2_x1)).clamp_(0) * (
        b1_y2.minimum(b2_y2) - b1_y1.maximum(b2_y1)
    ).clamp_(0)

    # Union Area
    union = w1 * h1 + w2 * h2 - inter + eps

    # IoU
    iou = inter / union
    
    if CIoU or DIoU or GIoU or WIoU:
        cw = b1_x2.maximum(b2_x2) - b1_x1.minimum(b2_x1)  # convex (smallest enclosing box) width
        ch = b1_y2.maximum(b2_y2) - b1_y1.minimum(b2_y1)  # convex height
        
        # Calculate center distance squared (rho2) and diagonal squared (c2)
        c2 = cw.pow(2) + ch.pow(2) + eps  # convex diagonal squared
        rho2 = (
            (b2_x1 + b2_x2 - b1_x1 - b1_x2).pow(2) + (b2_y1 + b2_y2 - b1_y1 - b1_y2).pow(2)
        ) / 4  # center dist**2
        
        if WIoU:
            # WIoU v1: L_WIoU = R_WIoU * L_IoU
            # R_WIoU = exp(rho2 / c2)
            # L_IoU = 1 - iou
            # Loss = exp(rho2 / c2) * (1 - iou)
            # We need to return a value 'val' such that 1 - val = Loss
            # So val = 1 - Loss = 1 - exp(rho2/c2) * (1 - iou)
            R_WIoU = torch.exp(rho2 / c2)
            return 1 - R_WIoU * (1 - iou)

        if CIoU or DIoU:  # Distance or Complete IoU
            if CIoU:  # https://github.com/Zzh-tju/DIoU-SSD-pytorch/blob/master/utils/box/box_utils.py#L47
                v = (4 / math.pi**2) * ((w2 / h2).atan() - (w1 / h1).atan()).pow(2)
                with torch.no_grad():
                    alpha = v / (v - iou + (1 + eps))
                return iou - (rho2 / c2 + v * alpha)  # CIoU
            return iou - rho2 / c2  # DIoU
            
        c_area = cw * ch + eps  # convex area
        return iou - (c_area - union) / c_area  # GIoU https://arxiv.org/pdf/1902.09630.pdf
        
    return iou  # IoU

class BboxLossWIoU(nn.Module):
    def __init__(self, reg_max, use_wiou=True):
        super().__init__()
        self.dfl_loss = ultralytics.utils.loss.DFLoss(reg_max) if reg_max > 1 else None
        self.use_wiou = use_wiou

    def forward(self, pred_dist, pred_bboxes, anchor_points, target_bboxes, target_scores, target_scores_sum, fg_mask):
        weight = target_scores.sum(-1)[fg_mask].unsqueeze(-1)
        # Force WIoU=True and CIoU=False
        iou = bbox_iou(pred_bboxes[fg_mask], target_bboxes[fg_mask], xywh=False, CIoU=False, WIoU=self.use_wiou)
        loss_iou = ((1.0 - iou) * weight).sum() / target_scores_sum

        if self.dfl_loss:
            target_ltrb = ultralytics.utils.tal.bbox2dist(anchor_points, target_bboxes, self.dfl_loss.reg_max - 1)
            loss_dfl = self.dfl_loss(pred_dist[fg_mask].view(-1, self.dfl_loss.reg_max), target_ltrb[fg_mask]) * weight
            loss_dfl = loss_dfl.sum() / target_scores_sum
        else:
            loss_dfl = torch.tensor(0.0).to(pred_dist.device)

        return loss_iou, loss_dfl

# ==============================================================================
# 2. CBAM Implementation (Copied from ultralytics source to ensure availability)
# ==============================================================================

class ChannelAttention(nn.Module):
    def __init__(self, channels: int) -> None:
        super().__init__()
        self.pool = nn.AdaptiveAvgPool2d(1)
        self.fc = nn.Conv2d(channels, channels, 1, 1, 0, bias=True)
        self.act = nn.Sigmoid()

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        return x * self.act(self.fc(self.pool(x)))

class SpatialAttention(nn.Module):
    def __init__(self, kernel_size=7):
        super().__init__()
        assert kernel_size in {3, 7}, "kernel size must be 3 or 7"
        padding = 3 if kernel_size == 7 else 1
        self.cv1 = nn.Conv2d(2, 1, kernel_size, padding=padding, bias=False)
        self.act = nn.Sigmoid()

    def forward(self, x):
        return x * self.act(self.cv1(torch.cat([torch.mean(x, 1, keepdim=True), torch.max(x, 1, keepdim=True)[0]], 1)))

class CBAM(nn.Module):
    def __init__(self, c1, c2=None, kernel_size=7):
        super().__init__()
        # Ensure c2 is set (for compatibility if passed as positional)
        if c2 is None:
            c2 = c1
            
        self.channel_attention = ChannelAttention(c1)
        self.spatial_attention = SpatialAttention(kernel_size)

    def forward(self, x):
        return self.spatial_attention(self.channel_attention(x))

# ==============================================================================
# 3. Registration Function
# ==============================================================================

def register_extensions():
    """
    Patches Ultralytics to use WIoU and registers CBAM.
    """
    print("🚀 Registering Custom Extensions (WIoU + CBAM)...")
    
    # 1. Patch bbox_iou in metrics and loss
    ultralytics.utils.metrics.bbox_iou = bbox_iou
    ultralytics.utils.loss.bbox_iou = bbox_iou
    
    # 2. Patch v8DetectionLoss.__init__ to use BboxLossWIoU
    # This avoids PicklingError by keeping the class object identity intact
    
    # Store original init method
    _original_init = ultralytics.utils.loss.v8DetectionLoss.__init__

    def new_v8_detection_loss_init(self, model, tal_topk=10):
        # Call original init
        _original_init(self, model, tal_topk)
        # Replace bbox_loss with WIoU version
        # Note: BboxLossWIoU must be available at module level for pickle to find it
        self.bbox_loss = BboxLossWIoU(model.model[-1].reg_max, use_wiou=True).to(self.device)
        print(f"✅ v8DetectionLoss initialized with WIoU (Pickle-Safe Patch)")

    # Apply the patch to the method, not the class object itself
    ultralytics.utils.loss.v8DetectionLoss.__init__ = new_v8_detection_loss_init
    
    # 3. Register CBAM in ultralytics.nn.tasks for YAML parsing
    # This allows the model parser to find 'CBAM' class when reading config
    if not hasattr(ultralytics.nn.tasks, 'CBAM'):
        ultralytics.nn.tasks.CBAM = CBAM
        # Also ensure it's in the globals of the module if needed (usually direct attr set is enough)
        
    print("✅ Extensions Registered Successfully.")
