import React from 'react';
import './Card.css';

export type CardPadding = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  padding?: CardPadding;
  withBorder?: boolean;
  children?: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({
  padding = 'md',
  withBorder = true,
  children,
  className = '',
  style,
  ...rest
}) => {
  const classes = [
    'mantine-card',
    `mantine-card--padding-${padding}`,
    withBorder ? 'mantine-card--with-border' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={classes} style={style} {...rest}>
      {children}
    </div>
  );
};

export default Card;
