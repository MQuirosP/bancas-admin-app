// components/ui/Toolbar.tsx
import { XStack, Card } from 'tamagui'

export const Toolbar: React.FC<React.ComponentProps<typeof XStack>> = (props) => (
  <Card
    {...props}
    padding="$3"
    backgroundColor="$backgroundHover"
    borderColor="$borderColor"
    borderWidth={1}
    elevate
  />
)
