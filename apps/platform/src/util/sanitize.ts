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
 * XSS sanitization utility.
 * XSS 输入过滤工具。
 *
 * Provides input sanitization for user-editable fields such as
 * DAG node names, data table descriptions, etc.
 *
 * 为用户可编辑字段（如 DAG 节点名称、数据表描述等）提供输入过滤。
 */

// HTML entity mapping for safe encoding / HTML 实体映射
const HTML_ESCAPE_MAP: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#x27;',
  '/': '&#x2F;',
  '`': '&#96;',
};

// Regex for matching dangerous HTML entities / 匹配危险 HTML 实体
const HTML_ESCAPE_REGEX = /[&<>"'`/]/g;

// Dangerous patterns that should be stripped / 需要移除的危险模式
const DANGEROUS_PATTERNS: RegExp[] = [
  /javascript\s*:/gi,
  /vbscript\s*:/gi,
  /data\s*:\s*text\/html/gi,
  /on\w+\s*=/gi, // onclick=, onload=, etc.
  /<\s*script/gi,
  /<\s*\/\s*script/gi,
  /<\s*iframe/gi,
  /<\s*object/gi,
  /<\s*embed/gi,
  /<\s*link/gi,
  /<\s*meta/gi,
  /expression\s*\(/gi,
  /url\s*\(/gi,
];

// Maximum allowed input length / 最大允许输入长度
const MAX_INPUT_LENGTH = 10000;

/**
 * Escape HTML special characters to prevent XSS.
 * 转义 HTML 特殊字符以防止 XSS。
 *
 * @param input - Raw user input string
 * @returns HTML-escaped string
 *
 * @example
 * ```ts
 * escapeHtml('<script>alert("xss")</script>')
 * // => '&lt;script&gt;alert(&quot;xss&quot;)&lt;&#x2F;script&gt;'
 * ```
 */
export function escapeHtml(input: string): string {
  if (!input || typeof input !== 'string') {
    return '';
  }
  return input.replace(HTML_ESCAPE_REGEX, (char) => HTML_ESCAPE_MAP[char] || char);
}

/**
 * Sanitize user input by removing dangerous patterns.
 * 过滤用户输入，移除危险模式。
 *
 * This is a lightweight sanitizer for text fields. It strips
 * script injection patterns while preserving normal text content.
 *
 * 这是一个轻量级文本字段过滤器。移除脚本注入模式，同时保留正常文本内容。
 *
 * @param input - Raw user input string
 * @param maxLength - Maximum allowed length (default: 10000)
 * @returns Sanitized string safe for display
 *
 * @example
 * ```ts
 * sanitizeInput('Hello <script>alert(1)</script> World')
 * // => 'Hello  World'
 * ```
 */
export function sanitizeInput(
  input: string,
  maxLength: number = MAX_INPUT_LENGTH,
): string {
  if (!input || typeof input !== 'string') {
    return '';
  }

  // Truncate to max length / 截断到最大长度
  let result = input.slice(0, maxLength);

  // Remove dangerous patterns / 移除危险模式
  for (const pattern of DANGEROUS_PATTERNS) {
    result = result.replace(pattern, '');
  }

  // Remove null bytes / 移除空字节
  result = result.replace(/\0/g, '');

  // Trim whitespace / 去除首尾空白
  return result.trim();
}

/**
 * Sanitize input and escape HTML for safe rendering.
 * 过滤输入并转义 HTML 以安全渲染。
 *
 * Use this for fields that will be rendered as text content.
 * 用于将作为文本内容渲染的字段。
 *
 * @param input - Raw user input string
 * @param maxLength - Maximum allowed length
 * @returns Sanitized and HTML-escaped string
 */
export function sanitizeAndEscape(input: string, maxLength?: number): string {
  return escapeHtml(sanitizeInput(input, maxLength));
}

/**
 * Sanitize a DAG node name.
 * 过滤 DAG 节点名称。
 *
 * Node names have stricter limits and allow only safe characters.
 * 节点名称有更严格的限制，仅允许安全字符。
 *
 * @param name - Raw node name input
 * @returns Sanitized node name (max 128 chars)
 */
export function sanitizeNodeName(name: string): string {
  if (!name || typeof name !== 'string') {
    return '';
  }

  // Allow: letters, digits, Chinese, underscore, hyphen, space, dot
  // 允许：字母、数字、中文、下划线、连字符、空格、点
  const cleaned = name.replace(/[^\w\u4e00-\u9fa5\s\-.]/g, '');
  return cleaned.slice(0, 128).trim();
}

/**
 * Sanitize a data table/column description.
 * 过滤数据表/列描述。
 *
 * @param description - Raw description input
 * @returns Sanitized description (max 512 chars)
 */
export function sanitizeDescription(description: string): string {
  return sanitizeInput(description, 512);
}

/**
 * Validate and sanitize a URL input.
 * 验证并过滤 URL 输入。
 *
 * Only allows http/https protocols.
 * 仅允许 http/https 协议。
 *
 * @param url - Raw URL input
 * @returns Sanitized URL or empty string if invalid
 */
export function sanitizeUrl(url: string): string {
  if (!url || typeof url !== 'string') {
    return '';
  }

  const trimmed = url.trim();

  // Only allow http/https / 仅允许 http/https
  if (!/^https?:\/\//i.test(trimmed)) {
    return '';
  }

  // Remove dangerous patterns / 移除危险模式
  let result = trimmed;
  for (const pattern of DANGEROUS_PATTERNS) {
    result = result.replace(pattern, '');
  }

  return result.slice(0, 2048);
}

/**
 * Check if input contains potentially dangerous content.
 * 检查输入是否包含潜在危险内容。
 *
 * @param input - String to check
 * @returns true if dangerous patterns detected
 */
export function containsDangerousContent(input: string): boolean {
  if (!input || typeof input !== 'string') {
    return false;
  }
  return DANGEROUS_PATTERNS.some((pattern) => pattern.test(input));
}
