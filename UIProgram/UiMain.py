# -*- coding: utf-8 -*-
import sys
from PyQt5.QtCore import Qt, QSize, QRect
from PyQt5.QtWidgets import QWidget, QVBoxLayout, QHBoxLayout, QSpacerItem, QSizePolicy, QLabel, QFrame, QGroupBox
from PyQt5.QtGui import QIcon, QPixmap, QColor
from qfluentwidgets import (FluentWindow, SubtitleLabel, CardWidget, ImageLabel,
                            PrimaryPushButton, PushButton, ToolButton, SearchLineEdit,
                            LineEdit, TableWidget, ComboBox, setTheme, Theme,
                            BodyLabel, StrongBodyLabel, FluentIcon, Icon,
                            NavigationItemPosition, InfoBar, InfoBarPosition)

class PCBWindow(FluentWindow):
    def __init__(self):
        super().__init__()
        self.setWindowTitle("PCB Defect Detection System")
        self.resize(1250, 830)
        self.setWindowIcon(QIcon(":/icons/ui_imgs/icons/目标检测.png"))
        
        # Enable Dark Theme
        setTheme(Theme.DARK)

        # 1. Initialize all widgets (maintaining original variable names)
        self.init_widgets()

        # 2. Create sub-interfaces
        self.homeInterface = QWidget()
        self.homeInterface.setObjectName("homeInterface")
        self.historyInterface = QWidget()
        self.historyInterface.setObjectName("historyInterface")

        # 3. Setup Layouts
        self.init_home_layout()
        self.init_history_layout()

        # 4. Initialize Navigation
        self.init_navigation()

    def init_widgets(self):
        """Initialize widgets with original variable names"""
        # --- Video/Image Display ---
        self.label_show = ImageLabel()
        self.label_show.setBorderRadius(8, 8, 8, 8)
        self.label_show.setScaledContents(True)
        # Placeholder image or style
        self.label_show.setStyleSheet("background-color: #202020; border: 1px solid #303030;")

        # --- Control Panel Inputs ---
        self.PiclineEdit = SearchLineEdit()
        self.PiclineEdit.setPlaceholderText("选择图片路径")
        
        self.VideolineEdit = SearchLineEdit()
        self.VideolineEdit.setPlaceholderText("选择视频路径")
        
        self.CaplineEdit = LineEdit()
        self.CaplineEdit.setPlaceholderText("摄像头状态")
        self.CaplineEdit.setReadOnly(True)

        # --- Buttons ---
        # Using ToolButton for icons
        self.PicBtn = ToolButton(FluentIcon.PHOTO, self)
        self.PicBtn.setToolTip("打开图片")
        
        self.VideoBtn = ToolButton(FluentIcon.VIDEO, self)
        self.VideoBtn.setToolTip("打开视频")
        
        self.CapBtn = ToolButton(FluentIcon.CAMERA, self)
        self.CapBtn.setToolTip("打开摄像头")
        
        self.FilesBtn = ToolButton(FluentIcon.FOLDER, self)
        self.FilesBtn.setToolTip("批量检测")

        # Action Buttons
        self.SaveBtn = PrimaryPushButton(FluentIcon.SAVE, "保存结果", self)
        self.ExitBtn = PushButton(FluentIcon.POWER_BUTTON, "退出系统", self)
        # Custom style for Exit button to look red-ish/warning if desired, 
        # but standard Fluent PushButton is fine.

        # --- Info Labels ---
        self.label_nums = StrongBodyLabel("0")
        self.time_lb = BodyLabel("0.000 s")
        self.label_conf = BodyLabel("0.00 %")
        
        self.label_xmin = BodyLabel("0")
        self.label_ymin = BodyLabel("0")
        self.label_xmax = BodyLabel("0")
        self.label_ymax = BodyLabel("0")

        # --- ComboBox ---
        self.comboBox = ComboBox()
        self.comboBox.setPlaceholderText("选择目标")

        # --- TableWidget (History) ---
        self.tableWidget = TableWidget()
        self.tableWidget.setColumnCount(5)
        self.tableWidget.setHorizontalHeaderLabels(['序号', '路径', '类别', '置信度', '位置'])
        self.tableWidget.verticalHeader().hide()
        self.tableWidget.setBorderVisible(True)
        self.tableWidget.setBorderRadius(8)
        self.tableWidget.setWordWrap(False)

    def init_home_layout(self):
        h_layout = QHBoxLayout(self.homeInterface)
        h_layout.setContentsMargins(20, 20, 20, 20)
        h_layout.setSpacing(20)

        # Left Side: Video/Image Display (70%)
        h_layout.addWidget(self.label_show, 7)

        # Right Side: Control Panel (30%)
        right_panel = CardWidget()
        right_layout = QVBoxLayout(right_panel)
        right_layout.setSpacing(15)
        right_layout.setContentsMargins(20, 20, 20, 20)

        # 1. Title
        title = SubtitleLabel("控制面板")
        right_layout.addWidget(title)

        # 2. Input Group
        input_group = QWidget()
        input_layout = QVBoxLayout(input_group)
        input_layout.setContentsMargins(0, 0, 0, 0)
        input_layout.setSpacing(10)
        
        # Row 1: Pic Input + Button
        row1 = QHBoxLayout()
        row1.addWidget(self.PiclineEdit)
        row1.addWidget(self.PicBtn)
        input_layout.addLayout(row1)

        # Row 2: Video Input + Button
        row2 = QHBoxLayout()
        row2.addWidget(self.VideolineEdit)
        row2.addWidget(self.VideoBtn)
        input_layout.addLayout(row2)

        # Row 3: Cam Input + Button
        row3 = QHBoxLayout()
        row3.addWidget(self.CaplineEdit)
        row3.addWidget(self.CapBtn)
        input_layout.addLayout(row3)
        
        # Row 4: Batch Files
        row4 = QHBoxLayout()
        lbl_batch = BodyLabel("批量检测:")
        row4.addWidget(lbl_batch)
        row4.addStretch()
        row4.addWidget(self.FilesBtn)
        input_layout.addLayout(row4)

        right_layout.addWidget(input_group)

        # 3. Status Card
        status_card = CardWidget()
        status_layout = QVBoxLayout(status_card)
        status_layout.setSpacing(10)
        
        # Stats Rows
        def create_stat_row(label, value_widget):
            r = QHBoxLayout()
            r.addWidget(BodyLabel(label))
            r.addStretch()
            r.addWidget(value_widget)
            return r

        status_layout.addLayout(create_stat_row("检测耗时:", self.time_lb))
        status_layout.addLayout(create_stat_row("目标数量:", self.label_nums))
        status_layout.addLayout(create_stat_row("置信度:", self.label_conf))
        
        # Coordinates Grid
        coord_group = QGroupBox("当前目标坐标")
        coord_layout = QHBoxLayout(coord_group)
        
        col1 = QVBoxLayout()
        col1.addLayout(create_stat_row("X Min:", self.label_xmin))
        col1.addLayout(create_stat_row("Y Min:", self.label_ymin))
        
        col2 = QVBoxLayout()
        col2.addLayout(create_stat_row("X Max:", self.label_xmax))
        col2.addLayout(create_stat_row("Y Max:", self.label_ymax))
        
        coord_layout.addLayout(col1)
        coord_layout.addLayout(col2)
        
        status_layout.addWidget(coord_group)
        
        # ComboBox
        status_layout.addWidget(self.comboBox)

        right_layout.addWidget(status_card)

        # 4. Bottom Actions
        right_layout.addStretch()
        right_layout.addWidget(self.SaveBtn)
        right_layout.addWidget(self.ExitBtn)

        h_layout.addWidget(right_panel, 3)

    def init_history_layout(self):
        layout = QVBoxLayout(self.historyInterface)
        layout.setContentsMargins(20, 20, 20, 20)
        
        title = SubtitleLabel("历史记录")
        layout.addWidget(title)
        
        layout.addWidget(self.tableWidget)

    def init_navigation(self):
        self.addSubInterface(self.homeInterface, FluentIcon.HOME, "主页")
        self.addSubInterface(self.historyInterface, FluentIcon.HISTORY, "记录")
        
        # Set default
        self.switchTo(self.homeInterface)

if __name__ == '__main__':
    from PyQt5.QtWidgets import QApplication
    app = QApplication(sys.argv)
    w = PCBWindow()
    w.show()
    sys.exit(app.exec_())
