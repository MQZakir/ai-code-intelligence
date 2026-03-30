import { useTheme } from '../contexts/ThemeContext';
import Logo from './Logo';

const AnimatedLogo = ({ size = 32, animate = true }: { size?: number; animate?: boolean }) => {
  const { isDarkMode } = useTheme();
  return <Logo size={size} animate={animate} color="#6366f1" />;
};

export default AnimatedLogo;