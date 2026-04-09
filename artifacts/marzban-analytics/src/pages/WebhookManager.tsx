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
  Select,
  SimpleGrid,
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
  ArrowPathIcon,
  LinkIcon,
  PencilIcon,
  PlusIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import { chakra } from "@chakra-ui/react";
import { FC, useState } from "react";
import { Header } from "components/Header";

const EditIcon = chakra(PencilIcon, { baseStyle: { w: 4, h: 4 } });
const DeleteIcon = chakra(TrashIcon, { baseStyle: { w: 4, h: 4 } });
const AddIcon = chakra(PlusIcon, { baseStyle: { w: 4, h: 4 } });
const TestIcon = chakra(ArrowPathIcon, { baseStyle: { w: 4, h: 4 } });

const ALL_EVENTS = [
  { key: "user.created", label: "Kullanıcı Oluşturuldu", color: "green" },
  { key: "user.deleted", label: "Kullanıcı Silindi", color: "red" },
  { key: "user.expired", label: "Kullanıcı Süresi Doldu", color: "orange" },
  { key: "user.data_limit_reached", label: "Data Limiti Doldu", color: "red" },
  { key: "user.updated", label: "Kullanıcı Güncellendi", color: "blue" },
  { key: "node.down", label: "Node Çevrimdışı", color: "red" },
  { key: "node.up", label: "Node Çevrimiçi", color: "green" },
  { key: "admin.login", label: "Admin Girişi", color: "purple" },
  { key: "system.high_cpu", label: "Yüksek CPU (%90+)", color: "orange" },
  { key: "system.high_ram", label: "Yüksek RAM (%90+)", color: "orange" },
  { key: "system.disk_full", label: "Disk Dolmak Üzere", color: "red" },
];

interface Webhook {
  id: number;
  name: string;
  url: string;
  secret: string;
  events: string[];
  method: "POST" | "GET";
  active: boolean;
  lastTriggered: string | null;
  triggerCount: number;
  lastStatus?: number;
}

const initialWebhooks: Webhook[] = [
  {
    id: 1, name: "Telegram Bildirim Bot", url: "https://api.telegram.org/bot.../sendMessage",
    secret: "tg_secret_123", events: ["user.expired", "user.data_limit_reached", "node.down"],
    method: "POST", active: true, lastTriggered: "2026-04-09 14:22:10", triggerCount: 245, lastStatus: 200,
  },
  {
    id: 2, name: "Discord Sunucu", url: "https://discord.com/api/webhooks/...",
    secret: "", events: ["node.down", "node.up", "system.high_cpu"],
    method: "POST", active: true, lastTriggered: "2026-04-08 09:15:33", triggerCount: 18, lastStatus: 204,
  },
  {
    id: 3, name: "Özel Monitoring", url: "https://monitor.myserver.com/hook",
    secret: "my_monitor_key", events: ["user.created", "admin.login"],
    method: "POST", active: false, lastTriggered: null, triggerCount: 0,
  },
];

const emptyForm: Omit<Webhook, "id" | "lastTriggered" | "triggerCount" | "lastStatus"> = {
  name: "", url: "", secret: "", events: [], method: "POST", active: true,
};

export const WebhookManager: FC = () => {
  const [webhooks, setWebhooks] = useState<Webhook[]>(initialWebhooks);
  const [editing, setEditing] = useState<Webhook | null>(null);
  const [form, setForm] = useState<Omit<Webhook, "id" | "lastTriggered" | "triggerCount" | "lastStatus">>(emptyForm);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    onOpen();
  };

  const openEdit = (w: Webhook) => {
    setEditing(w);
    setForm({ name: w.name, url: w.url, secret: w.secret, events: [...w.events], method: w.method, active: w.active });
    onOpen();
  };

  const handleSave = () => {
    if (!form.url) return;
    if (editing) {
      setWebhooks((prev) => prev.map((w) => w.id === editing.id ? { ...w, ...form } : w));
      toast({ title: "Webhook güncellendi", status: "success", duration: 2000 });
    } else {
      setWebhooks((prev) => [...prev, { ...form, id: Date.now(), lastTriggered: null, triggerCount: 0 }]);
      toast({ title: "Webhook oluşturuldu", status: "success", duration: 2000 });
    }
    onClose();
  };

  const handleDelete = (id: number) => {
    setWebhooks((prev) => prev.filter((w) => w.id !== id));
    toast({ title: "Webhook silindi", status: "info", duration: 2000 });
  };

  const handleTest = (w: Webhook) => {
    toast({ title: `"${w.name}" test isteği gönderildi`, description: "200 OK simüle edildi", status: "success", duration: 3000 });
  };

  return (
    <VStack w="full" minH="100vh" bg="gray.900" spacing={0}>
      <Box w="full" px={6} py={3} borderBottom="1px solid" borderColor="gray.700">
        <Header />
      </Box>
      <Box w="full" maxW="1200px" mx="auto" px={6} py={6}>
        <HStack justify="space-between" mb={6} flexWrap="wrap" gap={3}>
          <HStack>
            <LinkIcon style={{ width: 24, height: 24, color: "#63B3ED" }} />
            <Heading size="md" color="white">Webhook Yönetimi</Heading>
          </HStack>
          <Button size="sm" leftIcon={<AddIcon />} colorScheme="blue" onClick={openCreate}>
            Yeni Webhook
          </Button>
        </HStack>

        <VStack spacing={4} align="stretch">
          {webhooks.map((w) => (
            <Box key={w.id} bg="gray.800" borderRadius="xl" border="1px solid" borderColor={w.active ? "gray.700" : "gray.800"} p={5} opacity={w.active ? 1 : 0.6}>
              <HStack justify="space-between" mb={3} flexWrap="wrap" gap={2}>
                <HStack>
                  <Text fontWeight="bold" color="white">{w.name}</Text>
                  <Badge colorScheme={w.active ? "green" : "gray"}>{w.active ? "Aktif" : "Pasif"}</Badge>
                  {w.lastStatus && (
                    <Badge colorScheme={w.lastStatus < 300 ? "green" : "red"}>HTTP {w.lastStatus}</Badge>
                  )}
                </HStack>
                <HStack>
                  <Tooltip label="Test Et">
                    <IconButton size="sm" icon={<TestIcon />} aria-label="Test" variant="outline" colorScheme="cyan" onClick={() => handleTest(w)} />
                  </Tooltip>
                  <IconButton size="sm" icon={<EditIcon />} aria-label="Düzenle" variant="outline" colorScheme="blue" onClick={() => openEdit(w)} />
                  <IconButton size="sm" icon={<DeleteIcon />} aria-label="Sil" variant="outline" colorScheme="red" onClick={() => handleDelete(w.id)} />
                </HStack>
              </HStack>
              <Text fontFamily="mono" fontSize="sm" color="blue.300" mb={3} isTruncated>{w.url}</Text>
              <HStack flexWrap="wrap" spacing={2} mb={3}>
                {w.events.map((e) => {
                  const ev = ALL_EVENTS.find((a) => a.key === e);
                  return <Badge key={e} colorScheme={ev?.color || "gray"} fontSize="xs">{ev?.label || e}</Badge>;
                })}
              </HStack>
              <HStack fontSize="xs" color="gray.500" spacing={4}>
                <Text>Tetiklenme: {w.triggerCount} kez</Text>
                <Text>Son: {w.lastTriggered || "Hiç"}</Text>
                <Badge colorScheme="purple">{w.method}</Badge>
              </HStack>
            </Box>
          ))}
        </VStack>
      </Box>

      <Modal isOpen={isOpen} onClose={onClose} size="lg">
        <ModalOverlay backdropFilter="blur(6px)" />
        <ModalContent bg="gray.800" border="1px solid" borderColor="gray.700">
          <ModalHeader color="white">{editing ? "Webhook Düzenle" : "Yeni Webhook"}</ModalHeader>
          <ModalCloseButton color="gray.400" />
          <ModalBody>
            <VStack spacing={4}>
              <HStack w="full">
                <FormControl>
                  <FormLabel color="gray.400" fontSize="sm">Ad</FormLabel>
                  <Input bg="gray.700" borderColor="gray.600" color="white" placeholder="Telegram Bot..." value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
                </FormControl>
                <FormControl flex="0 0 100px">
                  <FormLabel color="gray.400" fontSize="sm">Metod</FormLabel>
                  <Select bg="gray.700" borderColor="gray.600" color="white" value={form.method} onChange={(e) => setForm((f) => ({ ...f, method: e.target.value as "POST" | "GET" }))}>
                    <option value="POST">POST</option>
                    <option value="GET">GET</option>
                  </Select>
                </FormControl>
              </HStack>
              <FormControl>
                <FormLabel color="gray.400" fontSize="sm">URL</FormLabel>
                <Input bg="gray.700" borderColor="gray.600" color="white" fontFamily="mono" placeholder="https://..." value={form.url} onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))} />
              </FormControl>
              <FormControl>
                <FormLabel color="gray.400" fontSize="sm">Secret Key (isteğe bağlı)</FormLabel>
                <Input bg="gray.700" borderColor="gray.600" color="white" fontFamily="mono" placeholder="X-Secret header olarak gönderilir" value={form.secret} onChange={(e) => setForm((f) => ({ ...f, secret: e.target.value }))} />
              </FormControl>
              <FormControl>
                <FormLabel color="gray.400" fontSize="sm">Olaylar (en az 1 seçin)</FormLabel>
                <CheckboxGroup value={form.events} onChange={(vals) => setForm((f) => ({ ...f, events: vals as string[] }))}>
                  <SimpleGrid columns={2} spacing={2}>
                    {ALL_EVENTS.map((e) => (
                      <Checkbox key={e.key} value={e.key} colorScheme={e.color as any}>
                        <Text fontSize="xs" color="gray.300">{e.label}</Text>
                      </Checkbox>
                    ))}
                  </SimpleGrid>
                </CheckboxGroup>
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" color="gray.400" mr={3} onClick={onClose}>İptal</Button>
            <Button colorScheme="blue" onClick={handleSave}>Kaydet</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </VStack>
  );
};
