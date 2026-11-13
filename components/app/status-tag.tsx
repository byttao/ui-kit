import * as React from "react";
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  ExclamationCircleOutlined,
  MinusCircleOutlined,
  SyncOutlined,
} from "@ant-design/icons";
import { Tag, type TagProps } from "antd";

/** 预设状态：排队 / 进行中 / 成功 / 失败 / 警告 / 已取消 */
export type TaskStatusKind = "queued" | "processing" | "success" | "error" | "warning" | "cancelled";

const PRESET: Record<TaskStatusKind, { color: TagProps["color"]; icon: React.ReactNode; label: string }> = {
  queued: { color: "default", icon: <ClockCircleOutlined />, label: "排队中" },
  processing: { color: "processing", icon: <SyncOutlined spin />, label: "进行中" },
  success: { color: "success", icon: <CheckCircleOutlined />, label: "已完成" },
  error: { color: "error", icon: <CloseCircleOutlined />, label: "失败" },
  warning: { color: "warning", icon: <ExclamationCircleOutlined />, label: "警告" },
  cancelled: { color: "default", icon: <MinusCircleOutlined />, label: "已取消" },
};

export interface StatusTagProps extends Omit<TagProps, "color" | "icon"> {
  status: TaskStatusKind;
  /** 覆盖默认文案，如「生成中 40%」「下载失败」 */
  children?: React.ReactNode;
}

/**
 * 带图标的状态标签：状态不只靠颜色表达（WCAG 1.4.1；森翠 / 金韵 / 马卡龙下主色与功能色同色系）。
 * 颜色是 antd Tag 的预设状态色，文字档已在 antd-theme.ts 的 components.Tag 里调到 ≥ 4.5:1。
 *
 * @example
 * <StatusTag status="processing">生成中 {progress}%</StatusTag>
 * <StatusTag status="warning">下载失败</StatusTag>
 */
export function StatusTag({ status, children, ...props }: StatusTagProps) {
  const preset = PRESET[status];
  return (
    <Tag color={preset.color} icon={preset.icon} {...props}>
      {children ?? preset.label}
    </Tag>
  );
}
