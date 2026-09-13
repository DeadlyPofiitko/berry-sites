import React from 'react';
import Flex, { type ReactFlexProps } from './Flex';

export const Stack: React.FC<Omit<ReactFlexProps, 'direction'>> = (props) => {
  return <Flex direction="column" {...props} />;
};

export default Stack;
