import { HomeOutlined } from '@ant-design/icons';
import { Button, Tooltip } from 'antd';
import classNames from 'classnames';
import { history } from 'umi';

import { Platform, hasAccess } from '@/components/platform-wrapper';
import { LoginService } from '@/modules/login/login.service';
import { useModel } from '@/util/valtio-helper';

import styles from './index.less';

export const goHome = (loginService?: LoginService) => {
  const userInfo = loginService?.userInfo;
  if (hasAccess({ type: [Platform.AUTONOMY] }) && userInfo?.ownerId) {
    history.push(`/edge?ownerId=${userInfo.ownerId}&tab=workbench`);
  } else {
    history.push('/home?tab=project-management');
  }
};

interface BackToHomeProps {
  className?: string;
  type?: 'icon' | 'text';
}

export const BackToHome: React.FC<BackToHomeProps> = ({
  className,
  type = 'icon',
}: BackToHomeProps) => {
  const loginService = useModel(LoginService);

  const content = type === 'text' ? '返回主页' : <HomeOutlined />;

  return (
    <Tooltip title="返回主页">
      <Button
        type="text"
        className={classNames(styles.backToHome, className)}
        onClick={() => goHome(loginService)}
      >
        {content}
      </Button>
    </Tooltip>
  );
};
