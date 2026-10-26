import { Progress } from "antd";

export interface BatchProgress {
  current: number;
  total: number;
  /** 0 ~ 100，综合文件序号与单张内部阶段 */
  percent: number;
  /** 当前阶段说明，如“读取”“缩放”“输出” */
  stage: string;
  file_name: string;
}

/** 批处理进度：阶段 + 百分比 + antd 细进度条 + 当前文件与张数。 */
export function ProgressPanel({ progress }: { progress: BatchProgress | null }) {
  if (!progress) return null;
  const done = progress.percent >= 100;

  return (
    <div className="flex flex-col gap-1" aria-live="polite">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-text-secondary">{progress.stage}</span>
        <span className="font-strong tabular-nums">{Math.round(progress.percent)}%</span>
      </div>
      <Progress
        percent={progress.percent}
        showInfo={false}
        size="small"
        status={done ? "success" : "active"}
        className="m-0"
      />
      <div className="flex items-baseline justify-between gap-2 text-sm text-text-tertiary">
        <span className="min-w-0 truncate" title={progress.file_name}>
          {progress.file_name}
        </span>
        <span className="shrink-0 tabular-nums">
          {progress.current} / {progress.total}
        </span>
      </div>
    </div>
  );
}
