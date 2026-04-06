import { BoxProps, HStack, Text } from "@chakra-ui/react";
import { APP_NAME } from "constants/Project";
import { FC } from "react";

export const Footer: FC<BoxProps> = (props) => {
  return (
    <HStack w="full" py="0" position="relative" {...props}>
      <Text
        display="inline-block"
        flexGrow={1}
        textAlign="center"
        color="gray.500"
        fontSize="xs"
      >
        {APP_NAME} — Powered by Marzban
      </Text>
    </HStack>
  );
};
