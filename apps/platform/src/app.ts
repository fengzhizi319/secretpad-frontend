import { history } from 'umi';
import request from 'umi-request';
import { v4 as uuidv4 } from 'uuid';
import { message, notification } from 'antd';

const codeMessage: Record<number, string> = {
  200: '服务器成功返回请求的数据。',
  201: '新建或修改数据成功。',
  202: '一个请求已经进入后台排队（异步任务）。',
  204: '删除数据成功。',
  400: '发出的请求有错误，服务器没有进行新建或修改数据的操作。',
  401: '用户没有权限（令牌、用户名、密码错误）。',
  403: '用户得到授权，但是访问是被禁止的。',
  404: '发出的请求针对的是不存在的记录，服务器没有进行操作。',
  406: '请求的格式不可得。',
  410: '请求的资源被永久删除，且不会再得到的。',
  422: '当创建一个对象时，发生一个验证错误。',
  500: '服务器发生错误，请检查服务器。',
  502: '网关错误。',
  503: '服务不可用，服务器暂时过载或维护。',
  504: '网关超时。',
};

request.interceptors.request.use((url, options) => {
  const traceId = uuidv4(); // 生成唯一的 traceId
  const token = localStorage.getItem('User-Token') || '';
  return {
    url: `${url}`,
    options: {
      ...options,
      mode: 'cors',
      credentials: 'include',
      interceptors: true,
      headers: {
        'Content-Type': 'application/json',
        'User-Token': token,
        'Trace-Id': traceId,
      },
    },
  };
});

request.interceptors.response.use(async (response, options: any) => {
  // 1. 拦截 HTTP 状态码异常
  if (response.status < 200 || response.status >= 300) {
    const errorText = codeMessage[response.status] || response.statusText;
    const { status } = response;
    notification.error({
      message: `请求错误 ${status}: ${options?.url || ''}`,
      description: errorText,
    });
    return response;
  }

  // 2. 拦截业务状态码异常
  try {
    const data = await response.clone().json();
    if (data && data.status) {
      const { code, msg } = data.status;
      if (code === 202011602) {
        localStorage.removeItem('User-Token');
        if (history.location.pathname !== '/login') {
          history.push('/login');
          message.error('登录状态已过期，请重新登录');
        }
      } else if (code !== 0) {
        // 如果 options 中指定了 skipErrorToast 且为 true，则不进行全局 toast 提示，留给页面自行处理
        if (!options?.skipErrorToast) {
          message.error(msg || '系统错误，请重试');
        }
      }
    }
  } catch (error) {
    // 忽略非 JSON 格式的解析错误
    console.error('Failed to parse response JSON:', error);
  }

  return response;
});
