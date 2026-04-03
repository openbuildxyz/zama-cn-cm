import { useEffect } from 'react';
import { useRouter } from 'next/router';

// 登录入口暂时关闭，重定向到首页
const LoginPage: React.FC = () => {
  const router = useRouter();
  useEffect(() => { router.replace('/'); }, []);
  return null;
};

export default LoginPage;
