import torch
import sys

def check_gpu():
    print("="*30)
    print("环境检查报告")
    print("="*30)
    print(f"Python 版本: {sys.version.split()[0]}")
    try:
        print(f"PyTorch 版本: {torch.__version__}")
    except ImportError:
        print("PyTorch 未安装！")
        return

    print("-" * 30)
    
    if torch.cuda.is_available():
        print(f"✅ CUDA 可用！")
        print(f"CUDA 版本: {torch.version.cuda}")
        print(f"GPU 数量: {torch.cuda.device_count()}")
        for i in range(torch.cuda.device_count()):
            print(f"  设备 {i}: {torch.cuda.get_device_name(i)}")
        print("\n您可以使用 device=0 进行加速训练。")
    else:
        print("❌ CUDA 不可用。")
        print("当前仅支持 CPU 训练。")
        print("-" * 30)
        print("建议安装支持 CUDA 的 PyTorch 版本：")
        print("pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu118")
        print("(请根据您的显卡驱动版本选择合适的 CUDA 版本，如 cu118 或 cu121)")

if __name__ == "__main__":
    check_gpu()
