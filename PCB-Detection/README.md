# PCB Defect Detection System (PCB缺陷检测系统)

## 1. 项目概述

**PCB Defect Detection System** 是一个基于深度学习的桌面应用程序，旨在自动检测印刷电路板（PCB）上的常见缺陷。该项目结合了 **YOLOv8** 的强大目标检测能力和 **PyQt5** 的用户友好界面，为工业质检提供了一个高效、可视化的解决方案。

### 主要功能和特点
- **多模式检测**：支持单张图片、批量图片文件夹、视频文件以及实时摄像头检测。
- **六大缺陷识别**：能够精准识别以下 PCB 缺陷：
  - 缺失孔 (Missing Hole)
  - 老鼠咬痕 (Mouse Bite)
  - 开路 (Open Circuit)
  - 短路 (Short)
  - 毛刺 (Spur)
  - 铜渣 (Spurious Copper)
- **可视化结果**：在图像上实时绘制检测框、类别名称和置信度，支持中文标签显示。
- **结果统计**：自动统计各类缺陷的数量，并支持通过下拉菜单筛选特定类别的缺陷。
- **结果保存**：支持将检测后的图片或视频保存到本地，方便后续查看和分析。
- **现代化 UI**：基于 PyQt5 构建的现代化图形界面，操作简单直观。

### 技术栈和依赖项
- **编程语言**: Python 3.10
- **GUI 框架**: PyQt5
- **计算机视觉**: OpenCV (cv2), Pillow
- **深度学习模型**: YOLOv8 (Ultralytics)
- **数据处理**: NumPy

---

## 2. 安装指南

### 系统要求
- 操作系统: Windows / Linux / macOS (推荐 Windows)
- Python 版本: Python 3.10 或更高版本
- 显卡 (可选): 支持 CUDA 的 NVIDIA 显卡（用于加速模型推理，若无显卡则使用 CPU）

### 依赖安装步骤

1.  **克隆或下载项目**
    ```bash
    git clone <repository_url>
    cd PCBDetection
    ```

2.  **创建虚拟环境 (推荐)**
    ```bash
    # 创建虚拟环境
    python -m venv .venv

    # 激活虚拟环境 (Windows)
    .venv\Scripts\activate

    # 激活虚拟环境 (Linux/macOS)
    source .venv/bin/activate
    ```

3.  **安装依赖包**
    您可以使用以下命令安装所需的 Python 包：
    ```bash
    pip install ultralytics PyQt5 opencv-python Pillow numpy
    ```
    *或者运行项目自带的安装脚本（如果有）：*
    ```bash
    python installPackages.py
    ```

### 环境配置说明
- 确保 `Font/` 目录下包含 `platech.ttf` 字体文件，用于在图片上绘制中文标签。
- 确保 `models/` 目录下包含训练好的 YOLOv8 模型文件 (如 `best.pt`)。
- 默认配置文件为 `Config.py`，您可以在此修改模型路径和保存路径。

---

## 3. 使用说明

### 基本使用方法
1.  **启动程序**
    运行主程序文件：
    ```bash
    python MainProgram.py
    ```

2.  **操作界面**
    - **打开图片**: 点击“打开图片”按钮，选择一张 PCB 图片进行检测。
    - **批量检测**: 点击“批量检测”按钮，选择一个包含图片的文件夹进行批量处理。
    - **打开视频**: 点击“打开视频”按钮，选择本地视频文件进行检测。
    - **摄像头检测**: 点击“摄像头”按钮，启动连接的摄像头进行实时检测。
    - **保存结果**: 检测完成后，点击“保存结果”按钮将带有标注的图片或视频保存到 `save_data/` 目录。

### 配置选项说明
在 `Config.py` 文件中，您可以调整以下参数：
```python
# 图片及视频检测结果保存路径
save_path = 'save_data'

# 使用的模型路径
model_path = 'models/best.pt'

# 类别名称映射
names = {0: 'missing_hole', ...}
CH_names = ['缺失孔', ...]
```

### 示例代码片段
核心检测逻辑位于 `MainProgram.py` 中，调用 YOLO 模型进行推理：
```python
# 加载模型
self.model = YOLO(Config.model_path, task='detect')

# 执行检测
results = self.model(img_path)[0]

# 获取检测结果
location_list = results.boxes.xyxy.tolist() # 坐标
cls_list = results.boxes.cls.tolist()       # 类别
conf_list = results.boxes.conf.tolist()     # 置信度
```

---

## 4. 开发指南

### 项目结构说明
```text
PCBDetection/
├── MainProgram.py      # 程序入口，主窗口逻辑
├── Config.py           # 配置文件
├── detect_tools.py     # 检测辅助工具（绘图、坐标转换）
├── UIProgram/          # UI 界面相关文件
│   ├── UiMain.py       # PyQt5 生成的界面代码
│   ├── style.css       # 界面样式表
│   └── ui_imgs/        # 图标资源
├── models/             # 存放 YOLO 模型文件 (.pt)
├── save_data/          # 默认结果保存目录
├── datasets/           # 数据集目录
└── Font/               # 字体文件
```

### 构建和测试方法
- **修改 UI**: 使用 Qt Designer 修改 `UIProgram/UiMain.ui`，然后使用 `pyuic5` 转换为 Python 代码。
- **测试**: 运行 `CameraTest.py` 或 `VideoTest.py` 可以单独测试摄像头或视频功能。

### 贡献指南
欢迎提交 Issue 或 Pull Request 来改进本项目。请确保代码符合 PEP 8 规范，并添加必要的注释。

---

## 5. 许可证信息

### 版权声明
Copyright (c) 2026 PCB Defect Detection 

### 使用许可条款
本项目仅供学习和研究使用。未经授权，不得用于商业用途。


---

## 6. 联系方式

### 维护者信息
- **姓名**: [kenny]
- **邮箱**: [kenny030524@163.com]

### 问题反馈渠道
如果您在使用过程中遇到任何问题，请通过 GitHub Issues 或邮件联系我。
