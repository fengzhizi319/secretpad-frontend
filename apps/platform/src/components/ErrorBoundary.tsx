/**
 * Copyright 2023 Ant Group Co., Ltd.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * Global Error Boundary component.
 * 全局错误边界组件。
 *
 * Catches React rendering errors and displays a fallback UI.
 * Reports errors via the error-reporter utility.
 *
 * 捕获 React 渲染错误并显示回退 UI。
 * 通过 error-reporter 工具上报错误。
 */
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { reportError } from '@/util/error-reporter';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({ errorInfo });

    // Report error to monitoring service / 上报错误到监控服务
    reportError(error, {
      componentStack: errorInfo.componentStack,
      boundary: 'ErrorBoundary',
    });

    // Log to console in development / 开发环境输出到控制台
    if (process.env.NODE_ENV === 'development') {
      console.error('ErrorBoundary caught:', error, errorInfo);
    }
  }

  handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      // Use custom fallback if provided / 使用自定义回退 UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default fallback UI / 默认回退 UI
      return (
        <div
          style={{
            padding: '48px 24px',
            textAlign: 'center',
            color: '#666',
          }}
        >
          <h2 style={{ marginBottom: 16, color: '#333' }}>
            页面出现错误 / Something went wrong
          </h2>
          <p style={{ marginBottom: 24 }}>
            {this.state.error?.message || '未知错误 / Unknown error'}
          </p>
          <button
            onClick={this.handleReset}
            style={{
              padding: '8px 24px',
              backgroundColor: '#1890ff',
              color: '#fff',
              border: 'none',
              borderRadius: 4,
              cursor: 'pointer',
            }}
          >
            重试 / Retry
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
