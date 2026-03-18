# PCB Defect Detection System (PCB缺陷检测系统)

## 1. 项目概述

**PCB Defect Detection System** 是一个基于深度学习的智能检测平台，旨在自动检测印刷电路板（PCB）上的常见缺陷。本项目提供两种用户界面，以满足不同场景的需求：

1.  **Modern Electron App (推荐)**: 基于 **Electron + React + Flask** 构建的现代化桌面应用，拥有美观的 Material UI 界面、实时的硬件监控（Dashboard）以及更灵活的交互体验。
2.  **Legacy PyQt5 App**: 基于 **PyQt5** 的传统桌面应用，轻量级，无需 Node.js 环境。

### 主要功能和特点
- **多模式检测**：
    - **图片/视频检测**：支持上传本地文件进行推理。
    - **实时摄像头检测**：调用摄像头进行实时流处理。
    - **批量检测**：支持文件夹批量处理。
- **六大缺陷识别**：精准识别 Missing Hole, Mouse Bite, Open Circuit, Short, Spur, Spurious Copper。
- **现代化仪表盘 (Electron)**：实时显示 CPU/GPU/内存使用率，提供系统健康状态监控。
- **可视化结果**：
    - **实时标注**：在图像/视频上绘制检测框、类别和置信度。
    - **详细数据**：展示推理时间、目标数量、ROI 坐标等详细信息。
- **结果保存**：支持将检测结果保存到本地。

### 🚀 算法创新与优化 (Algorithm Innovations)
在基础 YOLOv8s 的基础上，本项目针对微小缺陷检测（如细小开路、短路）进行了深度定制和改进：
- **WIoU (Wise-IoU) 损失函数**: 替换了原生 CIoU。通过动态非单调聚焦机制（Dynamic Non-Monotonic Focusing Mechanism），智能分配高质量与低质量锚框的梯度权重，显著提升了回归精度和 `mAP@50-95` 指标。
- **CBAM 注意力机制**: 在 Backbone 的特征提取层（P3, P4, P5）无缝融入了 CBAM (Convolutional Block Attention Module)，结合通道与空间注意力，有效抑制了 PCB 基板复杂纹理的背景噪声，增强了微小缺陷的特征响应。
- **训练优化**: 采用 `Pickle-Safe` 的 Hook 机制动态注入改进模块，确保了模型权重的安全序列化；并针对 Windows 多进程死锁问题进行了 DataLoader 的工程化修复。

### 技术栈

#### Modern Version (Electron)
- **前端**: Electron, React 19, Material UI (MUI), Vite
- **后端**: Python (Flask), OpenCV, YOLOv8 (Ultralytics)
- **通信**: HTTP API (Flask) + IPC (Electron)
- **硬件监控**: systeminformation

#### Legacy Version (PyQt5)
- **GUI**: PyQt5
- **核心逻辑**: Python 3.10, OpenCV, YOLOv8

---

## 2. 安装指南

### 系统要求
- 操作系统: Windows (推荐) / Linux / macOS
- Python: 3.10+
- Node.js: 16+ (仅 Electron 版本需要)
- 显卡: 推荐 NVIDIA GPU (CUDA) 加速推理

### 1. Python 环境配置 (通用)

无论使用哪个版本，都需要配置 Python 环境：

```bash
# 1. 克隆项目
git clone <repository_url>
cd PCBDetection

# 2. 创建并激活虚拟环境 (推荐)
python -m venv .venv
# Windows:
.venv\Scripts\activate
# Linux/macOS:
source .venv/bin/activate

# 3. 安装 Python 依赖
pip install -r python-backend/requirements.txt
# 或者安装根目录的依赖 (包含 PyQt5)
pip install -r requirements.txt
```

### 2. Electron 前端配置 (仅 Modern 版本)

```bash
cd electron-app

# 安装 Node.js 依赖
npm install
```

---

## 3. 使用说明

### 方式一：运行 Modern Electron App (推荐)

此模式下，Electron 负责界面，Flask 负责后台推理。

1.  **启动开发环境** (自动同时启动前端和后端)：
    ```bash
    cd electron-app
    npm run dev
    ```
    *注意：该命令会并行启动 Vite 开发服务器 (Port 5173) 和 Flask 后端 (Port 5000)。*

2.  **操作指南**：
    - **Dashboard**: 查看系统硬件状态。
    - **Testing**:
        - 上传图片/视频或打开摄像头。
        - 调整 "Inference Settings" (FPS, Confidence, Quality)。
        - 查看 "Detailed Results" (推理时间, 坐标, 类别)。
    - **Settings**: 配置模型路径等参数。

### 方式二：运行 Legacy PyQt5 App

传统的单机桌面应用模式。

1.  **启动程序**：
    ```bash
    # 在项目根目录下
    python MainProgram.py
    ```

2.  **操作指南**：
    - 使用右侧按钮栏选择 "打开图片"、"打开视频" 或 "摄像头"。
    - 结果将显示在主窗口，并列出检测到的缺陷表格。

### 方式三：运行改进版模型训练 (Training)

如果您需要重新训练或微调加入了 WIoU 和 CBAM 的改进版模型：

1.  **启动训练脚本**：
    ```bash
    # 采用单线程数据加载以避免 Windows 死锁
    python train_improved.py
    ```

2.  **查看结果**：
    训练完成后，最新的权重文件（`best.pt`）将保存在 `PCB_Improved/v8s_CBAM_WIoU/weights/` 目录下，可直接替换原有模型进行推理。

---

## 4. 项目结构

```text
PCBDetection/
├── electron-app/           # [NEW] Electron + React 前端
│   ├── src/
│   │   ├── components/     # React 组件 (Dashboard, Testing, etc.)
│   │   └── App.jsx         # 主应用入口
│   ├── electron/           # Electron 主进程 (main.cjs, preload.js)
│   └── package.json        # Node.js 依赖配置
├── python-backend/         # [NEW] Flask 后端服务
│   ├── app.py              # Flask API 入口 (提供 /predict, /system_stats 接口)
│   └── detect_tools.py     # 推理辅助工具
├── UIProgram/              # [Legacy] PyQt5 界面资源
├── models/                 # YOLO 模型文件 (.pt)
├── extensions.py           # [NEW] YOLOv8 自定义扩展模块 (WIoU, CBAM)
├── yolov8s-cbam.yaml       # [NEW] 改进版网络结构配置
├── train_improved.py       # [NEW] 改进版模型训练启动脚本
├── MainProgram.py          # [Legacy] PyQt5 程序入口
├── Config.py               # 通用配置文件
└── requirements.txt        # Python 依赖列表
```

## 5. 许可证

Copyright (c) 2024 PCB Defect Detection Team.
本项目仅供学习和研究使用。

## 6. 联系方式

- **维护者**: kenny
- **邮箱**: kenny030524@163.com
