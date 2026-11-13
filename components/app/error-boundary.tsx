import * as React from "react";
import { CopyOutlined, ReloadOutlined } from "@ant-design/icons";
import { App as AntApp, Button, Result } from "antd";
import { cn } from "../../lib/cn";

export interface ErrorBoundaryProps {
  children: React.ReactNode;
  /** 标题，默认「界面出错了」 */
  title?: React.ReactNode;
  /** 出错时回调（写日志、上报） */
  onError?: (error: Error, info: React.ErrorInfo) => void;
  /** 自定义兜底界面；不传用 antd Result（错误信息 + 复制 + 重新加载） */
  fallback?: (error: Error, reset: () => void) => React.ReactNode;
  /** page：撑满一页（包住单个功能页时用）；screen：撑满窗口（包住整个应用时用，默认） */
  size?: "screen" | "page";
}

interface State {
  error: Error | null;
}

/**
 * 错误边界：渲染出错时显示原因、「复制错误信息」与「重新加载」，不是整页空白。
 * 放在 ThemeProvider **里面**（兜底界面用 antd Result，要拿到主题与 App.useApp）：
 *
 * @example
 * <ThemeProvider>
 *   <ErrorBoundary>
 *     <App />
 *   </ErrorBoundary>
 * </ThemeProvider>
 *
 * 也可以单独包住某个功能页（size="page"）：一页出错不影响侧栏和其他页，「重试」只重建这一页。
 * 注意：事件回调、Promise 里的异常不会进错误边界，那些用 try/catch + message / 日志处理。
 */
export class ErrorBoundary extends React.Component<ErrorBoundaryProps, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("[ui-kit] 界面渲染出错", error, info.componentStack);
    this.props.onError?.(error, info);
  }

  reset = () => this.setState({ error: null });

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;
    if (this.props.fallback) return this.props.fallback(error, this.reset);
    return <ErrorFallback error={error} title={this.props.title} size={this.props.size ?? "screen"} onReset={this.reset} />;
  }
}

function ErrorFallback({
  error,
  title = "界面出错了",
  size,
  onReset,
}: {
  error: Error;
  title?: React.ReactNode;
  size: "screen" | "page";
  onReset: () => void;
}) {
  const { message } = AntApp.useApp();
  const detail = `${error.name}: ${error.message}${error.stack ? `\n${error.stack}` : ""}`;
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(detail);
      message.success("已复制错误信息");
    } catch (err) {
      message.error(`复制失败：${err instanceof Error ? err.message : String(err)}`);
    }
  };
  return (
    <div className={cn("grid place-items-center p-8", size === "screen" ? "h-screen bg-layout" : "h-full")}>
      <Result
        status="error"
        title={title}
        subTitle={
          <span data-selectable className="block max-w-[560px] break-all font-mono text-sm">
            {error.message || String(error)}
          </span>
        }
        extra={[
          <Button key="copy" icon={<CopyOutlined />} onClick={copy}>
            复制错误信息
          </Button>,
          size === "page" ? (
            <Button key="retry" type="primary" icon={<ReloadOutlined />} onClick={onReset}>
              重试
            </Button>
          ) : (
            <Button key="reload" type="primary" icon={<ReloadOutlined />} onClick={() => window.location.reload()}>
              重新加载
            </Button>
          ),
        ]}
      />
    </div>
  );
}
