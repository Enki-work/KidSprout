#!/bin/bash
# 列出可用 iOS 设备和模拟器，选择后执行 npx expo run:ios

echo "正在获取可用设备列表..."
echo ""

# 获取所有设备（真机和模拟器）
RAW=$(xcrun xctrace list devices 2>&1)

# 分别提取真机和模拟器
DEVICES=()
UDIDS=()

# 解析输出，只保留 iPhone/iPad/iPod（排除 Mac 本机）
while IFS= read -r line; do
  # 排除 Mac 本机
  if [[ "$line" =~ "Mac mini" ]] || [[ "$line" =~ "Mac Pro" ]] || [[ "$line" =~ "MacBook" ]]; then
    continue
  fi
  # 用 grep 提取最后一个括号内的 UDID（兼容真机25位和模拟器36位，忽略尾部空白）
  UDID=$(echo "$line" | grep -oE '\([0-9A-Fa-f-]{24,36}\)' | tail -1 | tr -d '()')
  if [ -n "$UDID" ]; then
    # 去掉版本号和 UDID 括号，保留设备名
    NAME=$(echo "$line" | sed -E 's/ \([^)]+\) \([0-9A-Fa-f-]+\)[[:space:]]*$//' | xargs)
    DEVICES+=("$NAME")
    UDIDS+=("$UDID")
  fi
done <<< "$RAW"

if [ ${#DEVICES[@]} -eq 0 ]; then
  echo "未找到任何设备，请确认模拟器已启动或真机已连接。"
  exit 1
fi

# 显示设备列表
echo "可用设备："
echo "------------------------------"
for i in "${!DEVICES[@]}"; do
  echo "  $((i+1))) ${DEVICES[$i]}"
done
echo "------------------------------"
echo ""

# 让用户选择
while true; do
  read -p "请输入设备编号 (1-${#DEVICES[@]}): " CHOICE
  if [[ "$CHOICE" =~ ^[0-9]+$ ]] && [ "$CHOICE" -ge 1 ] && [ "$CHOICE" -le "${#DEVICES[@]}" ]; then
    break
  fi
  echo "无效输入，请重新输入。"
done

IDX=$((CHOICE - 1))
SELECTED_NAME="${DEVICES[$IDX]}"
SELECTED_UDID="${UDIDS[$IDX]}"

echo ""
echo "已选择：$SELECTED_NAME ($SELECTED_UDID)"
echo "正在启动..."
echo "💡 提示：Metro 启动后按 s 键可切换到 tunnel 模式（实体机无法连接局域网时使用）"
echo ""

npx expo run:ios --device "$SELECTED_UDID"
