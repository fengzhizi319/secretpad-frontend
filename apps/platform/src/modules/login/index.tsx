import { message } from 'antd';
import React from 'react';
import { history } from 'umi';

import clifeLogo from '@/assets/clife-logo.jpg';
import { Platform } from '@/components/platform-wrapper';
import { DefaultComponentInterpreterService } from '@/modules/component-interpreter/component-interpreter-service';
import { DefaultModalManager } from '@/modules/dag-modal-manager';
import { ThemeToggle } from '@/modules/theme/theme-toggle';
import platformConfig from '@/platform.config';
import { getModel, Model, useModel } from '@/util/valtio-helper';

import { LoginForm } from './component/login-form';
import type { UserInfo } from './component/login-form';
import styles from './index.less';
import type { User } from './login.service';
import { LoginService } from './login.service';

export const LoginComponent: React.FC = () => {
  const loginModel = useModel(LoginModel);
  return (
    <div className={styles.loginPage}>
      <div className={styles.themeToggleWrapper}>
        <ThemeToggle />
      </div>
      <div className={styles.loginBgBlobs}>
        <div className={`${styles.blob} ${styles.blob1}`} />
        <div className={`${styles.blob} ${styles.blob2}`} />
        <div className={`${styles.blob} ${styles.blob3}`} />
      </div>
      <div className={styles.loginCard}>
        <div className={styles.logoWrapper}>
          <img src={clifeLogo} alt="C-Life" />
        </div>
        <div className={styles.brandTitle}>c-life 隐私计算平台</div>
        <div className={styles.brandSlogan}>{platformConfig.slogan}</div>
        <LoginForm onConfirm={loginModel.loginConfirm} />
      </div>
    </div>
  );
};

export class LoginModel extends Model {
  token = '';
  loginService = getModel(LoginService);
  interpreterService = getModel(DefaultComponentInterpreterService);
  modalManager = getModel(DefaultModalManager);

  onViewMount(): void {
    this.modalManager.closeAllModals();
  }

  loginConfirm = async (loginFields: UserInfo) => {
    const { status, data } = await this.loginService.login({
      name: loginFields.name,
      password: loginFields.password,
    });

    const notFirstTimeIn = localStorage.getItem('notFirstTimeIn');
    this.token = data?.token || '';
    this.loginService.userInfo = data as User;
    if (status?.code === 0) {
      localStorage.setItem('User-Token', this.token);
      // P2P 模式跳转
      if (this.loginService.userInfo.platformType === Platform.AUTONOMY) {
        if (this.loginService.userInfo.ownerId) {
          localStorage.setItem('neverLogined', 'true');
          history.push(`/edge?ownerId=${this.loginService.userInfo.ownerId}`);
          message.success('登录成功');
          // 防止token失效后,直接刷新页面，重新登陆接口未重新调用
          this.interpreterService.getComponentI18n();
          return;
        }
      }

      // CENTER 和 EDGE 模式跳转
      if (this.loginService.userInfo.platformType === 'EDGE') {
        if (this.loginService.userInfo.ownerId) {
          localStorage.setItem('neverLogined', 'true');
          history.push(`/node?ownerId=${this.loginService.userInfo.ownerId}`);
        }
      } else {
        localStorage.setItem('neverLogined', 'true');
        if (notFirstTimeIn || !platformConfig.guide) {
          history.push('/');
        } else {
          // edge 账号登陆center平台不需要跳转到guide页面
          if (
            this.loginService.userInfo.platformType === 'CENTER' &&
            this.loginService.userInfo?.ownerType === 'EDGE'
          ) {
            history.push('/');
          } else {
            history.push('/guide');
          }
          localStorage.setItem('notFirstTimeIn', 'true');
        }
      }
      message.success('登录成功');
      // 防止token失效后,直接刷新页面，重新登陆接口未重新调用
      this.interpreterService.getComponentI18n();
    } else {
      message.error(status?.msg || '登录失败，请检查用户名或密码');
    }
  };
}
