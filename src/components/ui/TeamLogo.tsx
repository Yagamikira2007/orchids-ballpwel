import { useState, memo } from 'react';

interface TeamLogoProps {
  src?: string;
  name: string;
  size?: 'sm' | 'md' | 'lg';
}

const sizeMap = {
  sm: { img: 'w-8 h-8', text: 'text-base' },
  md: { img: 'w-11 h-11 md:w-14 md:h-14', text: 'text-xl md:text-2xl' },
  lg: { img: 'w-14 h-14', text: 'text-2xl' },
};

const TeamLogo = memo(({ src, name, size = 'sm' }: TeamLogoProps) => {
  const [failed, setFailed] = useState(false);
  const s = sizeMap[size];

  if (!src || failed) {
    return <span className={`${s.text} font-bold text-muted-foreground`}>{name.charAt(0)}</span>;
  }

  return (
    <img
      src={src}
      alt={name}
      className={`${s.img} object-contain`}
      onError={() => setFailed(true)}
    />
  );
});

TeamLogo.displayName = 'TeamLogo';
export default TeamLogo;
