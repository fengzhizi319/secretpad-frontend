import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Result, Button, Collapse, Typography, message } from 'antd';
import { ReloadOutlined, CopyOutlined } from '@ant-design/icons';

const { Paragraph, Text } = Typography;
const { Panel } = Collapse;

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo,
    });
    console.error('Uncaught React Error:', error, errorInfo);
  }

  private handleCopyError = () => {
    const { error, errorInfo } = this.state;
    const errorDetails = `
Error Message: ${error?.message || 'Unknown error'}
URL: ${window.location.href}
Time: ${new Date().toISOString()}
Stack Trace:
${error?.stack || ''}
Component Stack:
${errorInfo?.componentStack || ''}
    `.trim();

    navigator.clipboard.writeText(errorDetails).then(
      () => {
        message.success('错误日志已成功复制到剪贴板！');
      },
      () => {
        message.error('复制失败，请手动选择复制。');
      },
    );
  };

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '100vh',
            backgroundColor: '#f8fafc',
            padding: '24px',
          }}
        >
          <div
            style={{
              maxWidth: '800px',
              width: '100%',
              backgroundColor: '#fff',
              borderRadius: '8px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
              padding: '40px',
            }}
          >
            <Result
              status="error"
              title="系统检测到异常"
              subTitle="很抱歉，当前页面加载或渲染时发生意外错误。您可以尝试刷新页面，或者复制错误日志上报给管理员。"
              extra={[
                <Button
                  type="primary"
                  key="reload"
                  icon={<ReloadOutlined />}
                  onClick={this.handleReload}
                  size="large"
                >
                  刷新页面
                </Button>,
                <Button
                  key="copy"
                  icon={<CopyOutlined />}
                  onClick={this.handleCopyError}
                  size="large"
                >
                  复制错误日志
                </Button>,
              ]}
            >
              <div className="desc">
                <Paragraph>
                  <Text strong style={{ fontSize: 16 }}>
                    错误原因:
                  </Text>
                </Paragraph>
                <Paragraph style={{ color: '#ff4d4f', fontFamily: 'monospace' }}>
                  {this.state.error?.toString()}
                </Paragraph>

                {this.state.error?.stack && (
                  <Collapse ghost style={{ marginTop: 16 }}>
                    <Panel header="查看详细堆栈信息" key="1">
                      <pre
                        style={{
                          backgroundColor: '#fafafa',
                          padding: '12px',
                          borderRadius: '4px',
                          overflow: 'auto',
                          maxHeight: '300px',
                          fontSize: '12px',
                          textAlign: 'left',
                        }}
                      >
                        {this.state.error.stack}
                      </pre>
                    </Panel>
                  </Collapse>
                )}
              </div>
            </Result>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
export default ErrorBoundary;
