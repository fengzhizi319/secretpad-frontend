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
 * Unified error reporting utility.
 * 统一错误上报工具。
 *
 * Provides a consistent interface for reporting errors to monitoring services.
 * Supports Sentry, custom endpoints, or console logging.
 *
 * 提供一致的错误上报接口，支持 Sentry、自定义端点或控制台日志。
 */

export interface ErrorContext {
  componentStack?: string;
  boundary?: string;
  userId?: string;
  url?: string;
  [key: string]: unknown;
}

export interface ErrorReportPayload {
  message: string;
  stack?: string;
  timestamp: string;
  context: ErrorContext;
  userAgent: string;
}

// Error reporting endpoint (configurable) / 错误上报端点（可配置）
const ERROR_REPORT_ENDPOINT =
  process.env.ERROR_REPORT_ENDPOINT || '/api/v1alpha1/error-report';

// Whether error reporting is enabled / 是否启用错误上报
const ERROR_REPORTING_ENABLED = process.env.ERROR_REPORTING_ENABLED !== 'false';

// Rate limiting: max reports per minute / 速率限制：每分钟最大上报数
const MAX_REPORTS_PER_MINUTE = 10;
let reportCount = 0;
let lastResetTime = Date.now();

/**
 * Report an error to the monitoring service.
 * 上报错误到监控服务。
 *
 * @param error - The error object to report
 * @param context - Additional context information
 */
export function reportError(error: Error, context: ErrorContext = {}): void {
  if (!ERROR_REPORTING_ENABLED) {
    return;
  }

  // Rate limiting / 速率限制
  const now = Date.now();
  if (now - lastResetTime > 60000) {
    reportCount = 0;
    lastResetTime = now;
  }
  if (reportCount >= MAX_REPORTS_PER_MINUTE) {
    console.warn('Error reporting rate limited');
    return;
  }
  reportCount++;

  const payload: ErrorReportPayload = {
    message: error.message,
    stack: error.stack,
    timestamp: new Date().toISOString(),
    context: {
      ...context,
      url: window.location.href,
    },
    userAgent: navigator.userAgent,
  };

  // Log to console in development / 开发环境输出到控制台
  if (process.env.NODE_ENV === 'development') {
    console.error('[ErrorReporter]', payload);
    return;
  }

  // Send to backend endpoint / 发送到后端端点
  sendErrorReport(payload).catch((err) => {
    // Silent fail - don't throw during error handling
    // 静默失败 - 错误处理期间不抛出异常
    console.warn('Failed to send error report:', err);
  });
}

/**
 * Send error report to backend.
 * 发送错误报告到后端。
 */
async function sendErrorReport(payload: ErrorReportPayload): Promise<void> {
  try {
    await fetch(ERROR_REPORT_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      // Don't block on error reporting / 不阻塞错误上报
      keepalive: true,
    });
  } catch {
    // Network error - ignore / 网络错误 - 忽略
  }
}

/**
 * Report a custom event (non-error).
 * 上报自定义事件（非错误）。
 *
 * @param eventName - Event name
 * @param data - Event data
 */
export function reportEvent(
  eventName: string,
  data: Record<string, unknown> = {},
): void {
  if (!ERROR_REPORTING_ENABLED) {
    return;
  }

  if (process.env.NODE_ENV === 'development') {
    console.info('[EventReporter]', eventName, data);
    return;
  }

  // Can be extended to send to analytics service
  // 可扩展发送到分析服务
}

/**
 * Setup global error handlers.
 * 设置全局错误处理器。
 *
 * Call this once at app startup to capture unhandled errors.
 * 在应用启动时调用一次，捕获未处理的错误。
 */
export function setupGlobalErrorHandlers(): void {
  // Handle unhandled promise rejections / 处理未捕获的 Promise 拒绝
  window.addEventListener('unhandledrejection', (event) => {
    const error =
      event.reason instanceof Error ? event.reason : new Error(String(event.reason));
    reportError(error, { boundary: 'unhandledrejection' });
  });

  // Handle window errors / 处理窗口错误
  window.addEventListener('error', (event) => {
    const error = event.error || new Error(event.message);
    reportError(error, {
      boundary: 'window.onerror',
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
    });
  });
}
