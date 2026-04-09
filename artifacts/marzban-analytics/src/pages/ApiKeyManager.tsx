import {
  Badge,
  Box,
  Button,
  Checkbox,
  CheckboxGroup,
  FormControl,
  FormLabel,
  HStack,
  Heading,
  IconButton,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Stack,
  Table,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tooltip,
  Tr,
  VStack,
  useDisclosure,
  useToast,
} from "@chakra-ui/react";
import {
  ClipboardDocumentIcon,
  EyeIcon,
  EyeSlashIcon,
  KeyIcon,
  PlusIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import { chakra } from "@chakra-ui/react";
import { FC, useState } from "react";
import { Header } from "components/Header";

const CopyIcon = chakra(ClipboardDocumentIcon, { baseStyle: { w: 4, h: 4 } });
const DeleteIcon = chakra(TrashIcon, { baseStyle: { w: 4, h: 4 } });
const AddIcon = chakra(PlusIcon, { baseStyle: { w: 4, h: 4 } });
const ShowIcon = chakra(EyeIcon, { baseStyle: { w: 4, h: 4 } });
const HideIcon = chakra(EyeSlashIcon, { baseStyle: { w: 4, h: 4 } });

const PERMISSIONS = ["users:read", "users:write", "admins:read", "admins:write", "nodes:read", "system:read", "stats:read"];

interface ApiKey {
  id: number;
  name: string;
  key: string;
  permissions: string[];
  createdAt: string;
  lastUsed: string | null;
  active: boolean;
}

function generateKey() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let key = "xpbk_";
  for (let i = 0; i < 40; i++) key += chars[Math.floor(Math.random() * chars.length)];
  return key;
}

const initialKeys: ApiKey[] = [
  {
    id: 1, name: "Telegram Bot", key: generateKey(),
    permissions: ["users:read", "users:write", "stats:read"],
    createdAt: "2026-03-01", lastUsed: "2026-04-09", active: true,
  },
  {
    id: 2, name: "Monitoring Script", key: generateKey(),
    permissions: ["system:read", "stats:read", "nodes:read"],
    createdAt: "2026-02-15", lastUsed: "2026-04-08", active: true,
  },
  {
    id: 3, name: "Backup Service", key: generateKey(),
    permissions: ["users:read", "admins:read"],
    createdAt: "2026-01-10", lastUsed: null, active: false,
  },
];

export const ApiKeyManager: FC = () => {
  const [keys, setKeys] = useState<ApiKey[]>(initialKeys);
  const [showKey, setShowKey] = useState<Record<number, boolean>>({});
  const [newKeyName, setNewKeyName] = useState("");
  const [newKeyPerms, setNewKeyPerms] = useState<string[]>(["users:read"]);
  const [createdKey, setCreatedKey] = useState<string | null>(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { isOpen: isResultOpen, onOpen: onResultOpen, onClose: onResultClose } = useDisclosure();
  const toast = useToast();

  const handleCreate = () => {
    if (!newKeyName) return;
    const key = generateKey();
    const newEntry: ApiKey = {
      id: Date.now(),
      name: newKeyName,
      key,
      permissions: newKeyPerms,
      createdAt: new Date().toISOString().split("T")[0],
      lastUsed: null,
      active: true,
    };
    setKeys((prev) => [...prev, newEntry]);
    setCreatedKey(key);
    onClose();
    onResultOpen();
    setNewKeyName("");
    setNewKeyPerms(["users:read"]);
  };

  const handleRevoke = (id: number) => {
    setKeys((prev) => prev.map((k) => k.id === id ? { ...k, active: false } : k));
    toast({ title: "API key iptal edildi", status: "warning", duration: 2000 });
  };

  const handleDelete = (id: number) => {
    setKeys((prev) => prev.filter((k) => k.id !== id));
    toast({ title: "API key silindi", status: "info", duration: 2000 });
  };

  const copyKey = (key: string) => {
    navigator.clipboard.writeText(key);
    toast({ title: "Kopyalandı!", status: "success", duration: 1500 });
  };

  const maskKey = (key: string) => key.slice(0, 10) + "••••••••••••••••••••" + key.slice(-4);

  const permColor = (p: string) => {
    if (p.includes(":write")) return "orange";
    if (p.includes("system") || p.includes("admin")) return "red";
    return "blue";
  };

  return (
    <VStack w="full" minH="100vh" bg="gray.900" spacing={0}>
      <Box w="full" px={6} py={3} borderBottom="1px solid" borderColor="gray.700">
        <Header />
      </Box>
      <Box w="full" maxW="1200px" mx="auto" px={6} py={6}>
        <HStack justify="space-between" mb={6} flexWrap="wrap" gap={3}>
          <HStack>
            <KeyIcon style={{ width: 24, height: 24, color: "#ECC94B" }} />
            <Heading size="md" color="white">API Key Yönetimi</Heading>
          </HStack>
          <Button size="sm" leftIcon={<AddIcon />} colorScheme="yellow" onClick={onOpen}>
            Yeni API Key
          </Button>
        </HStack>

        <HStack mb={6} spacing={4}>
          {[
            { label: "Toplam Key", value: keys.length, color: "blue.400" },
            { label: "Aktif", value: keys.filter((k) => k.active).length, color: "green.400" },
            { label: "İptal Edilmiş", value: keys.filter((k) => !k.active).length, color: "red.400" },
          ].map(({ label, value, color }) => (
            <Box key={label} bg="gray.800" borderRadius="xl" p={4} border="1px solid" borderColor="gray.700" flex={1}>
              <Text fontSize="xs" color="gray.400">{label}</Text>
              <Text fontSize="xl" fontWeight="bold" color={color}>{value}</Text>
            </Box>
          ))}
        </HStack>

        <Box bg="gray.800" borderRadius="xl" border="1px solid" borderColor="gray.700" overflow="hidden">
          <Table size="sm" variant="unstyled">
            <Thead>
              <Tr bg="gray.750">
                <Th color="gray.400" fontSize="xs" py={4} pl={4}>Ad</Th>
                <Th color="gray.400" fontSize="xs">API Key</Th>
                <Th color="gray.400" fontSize="xs">İzinler</Th>
                <Th color="gray.400" fontSize="xs">Oluşturuldu</Th>
                <Th color="gray.400" fontSize="xs">Son Kullanım</Th>
                <Th color="gray.400" fontSize="xs">Durum</Th>
                <Th color="gray.400" fontSize="xs">İşlem</Th>
              </Tr>
            </Thead>
            <Tbody>
              {keys.map((k) => (
                <Tr key={k.id} borderTop="1px solid" borderColor="gray.700" _hover={{ bg: "gray.750" }} opacity={k.active ? 1 : 0.5}>
                  <Td pl={4} py={3}>
                    <Text color="white" fontWeight="medium" fontSize="sm">{k.name}</Text>
                  </Td>
                  <Td>
                    <HStack>
                      <Text fontSize="xs" fontFamily="mono" color="gray.300" maxW="200px" isTruncated>
                        {showKey[k.id] ? k.key : maskKey(k.key)}
                      </Text>
                      <IconButton
                        size="xs"
                        icon={showKey[k.id] ? <HideIcon /> : <ShowIcon />}
                        aria-label="Göster/Gizle"
                        variant="ghost"
                        colorScheme="gray"
                        onClick={() => setShowKey((prev) => ({ ...prev, [k.id]: !prev[k.id] }))}
                      />
                      <Tooltip label="Kopyala">
                        <IconButton size="xs" icon={<CopyIcon />} aria-label="Kopyala" variant="ghost" colorScheme="blue" onClick={() => copyKey(k.key)} />
                      </Tooltip>
                    </HStack>
                  </Td>
                  <Td>
                    <HStack flexWrap="wrap" spacing={1}>
                      {k.permissions.map((p) => (
                        <Badge key={p} colorScheme={permColor(p)} fontSize="2xs">{p}</Badge>
                      ))}
                    </HStack>
                  </Td>
                  <Td>
                    <Text fontSize="xs" color="gray.400">{k.createdAt}</Text>
                  </Td>
                  <Td>
                    <Text fontSize="xs" color={k.lastUsed ? "gray.300" : "gray.600"}>{k.lastUsed || "Hiç kullanılmadı"}</Text>
                  </Td>
                  <Td>
                    <Badge colorScheme={k.active ? "green" : "red"}>{k.active ? "Aktif" : "İptal"}</Badge>
                  </Td>
                  <Td>
                    <HStack spacing={1}>
                      {k.active && (
                        <Button size="xs" variant="outline" colorScheme="orange" onClick={() => handleRevoke(k.id)}>
                          İptal Et
                        </Button>
                      )}
                      <IconButton size="xs" icon={<DeleteIcon />} aria-label="Sil" variant="ghost" colorScheme="red" onClick={() => handleDelete(k.id)} />
                    </HStack>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </Box>
      </Box>

      <Modal isOpen={isOpen} onClose={onClose} size="md">
        <ModalOverlay backdropFilter="blur(6px)" />
        <ModalContent bg="gray.800" border="1px solid" borderColor="gray.700">
          <ModalHeader color="white">Yeni API Key Oluştur</ModalHeader>
          <ModalCloseButton color="gray.400" />
          <ModalBody>
            <VStack spacing={5}>
              <FormControl>
                <FormLabel color="gray.400" fontSize="sm">Key Adı (ne için kullanılacak)</FormLabel>
                <Input bg="gray.700" borderColor="gray.600" color="white" placeholder="Telegram Bot, Monitoring..." value={newKeyName} onChange={(e) => setNewKeyName(e.target.value)} />
              </FormControl>
              <FormControl>
                <FormLabel color="gray.400" fontSize="sm">İzinler</FormLabel>
                <CheckboxGroup value={newKeyPerms} onChange={(vals) => setNewKeyPerms(vals as string[])}>
                  <Stack spacing={2}>
                    {PERMISSIONS.map((p) => (
                      <Checkbox key={p} value={p} colorScheme={permColor(p) as any}>
                        <Text fontSize="sm" color="gray.300">{p}</Text>
                      </Checkbox>
                    ))}
                  </Stack>
                </CheckboxGroup>
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" color="gray.400" mr={3} onClick={onClose}>İptal</Button>
            <Button colorScheme="yellow" onClick={handleCreate}>Oluştur</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <Modal isOpen={isResultOpen} onClose={onResultClose} size="md">
        <ModalOverlay backdropFilter="blur(6px)" />
        <ModalContent bg="gray.800" border="1px solid" borderColor="green.500">
          <ModalHeader color="green.400">✅ API Key Oluşturuldu</ModalHeader>
          <ModalCloseButton color="gray.400" />
          <ModalBody>
            <Text color="yellow.300" fontSize="sm" mb={3}>
              ⚠️ Bu key bir daha gösterilmeyecek. Şimdi kopyalayın!
            </Text>
            <Box bg="gray.900" borderRadius="lg" p={4} fontFamily="mono" fontSize="sm" color="green.300" wordBreak="break-all">
              {createdKey}
            </Box>
          </ModalBody>
          <ModalFooter>
            <Button colorScheme="green" onClick={() => { copyKey(createdKey || ""); onResultClose(); }}>
              Kopyala & Kapat
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </VStack>
  );
};
