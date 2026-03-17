#coding:utf-8
from ultralytics import YOLO
from extensions import register_extensions

# 1. 注册自定义扩展 (WIoU 损失函数 & CBAM 模块解析)
register_extensions()

# 2. 加载带 CBAM 的自定义 YAML 配置
# 注意：nc 已经在 YAML 中设为 6
model = YOLO("yolov8s-cbam.yaml")  

if __name__ == '__main__':
    # 3. 开始训练
    # 自动加载之前训练好的 yolov8s.pt 权重作为预训练 (如果需要)
    # 或者直接从头开始训练
    results = model.train(
        data='datasets/PCB_DATASET/data.yaml', 
        epochs=150, 
        batch=32, 
        lr0=0.01, 
        device=0,
        project='PCB_Improved',
        name='v8s_CBAM_WIoU',
        workers=0
    )
