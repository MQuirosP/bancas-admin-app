import React from 'react'
import { Card as TCard } from 'tamagui'

export type UICardProps = React.ComponentProps<typeof TCard>

export const Card: React.FC<UICardProps> = (props) => (
  <TCard
    elevate
    bw={1}
    bc="$borderColor"
    bg="$backgroundHover"
    {...props}
  />
)

export default Card
