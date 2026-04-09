import {
  Badge,
  Box,
  Button,
  Divider,
  FormControl,
  FormHelperText,
  FormLabel,
  HStack,
  Heading,
  Input,
  InputGroup,
  InputRightElement,
  Switch,
  Table,
  Tbody,
  Td,
  Text,
  Textarea,
  Th,
  Thead,
  Tr,
  VStack,
  useToast,
} from "@chakra-ui/react";
import {
  CheckCircleIcon,
  EyeIcon,
  EyeSlashIcon,
  PaperAirplaneIcon,
} from "@heroicons/react/24/outline";
import { chakra } from "@chakra-ui/react";
import { FC, useState } from "react";
import { Header } from "components/Header";

const ShowIcon = chakra(EyeIcon, { baseStyle: { w: 4, h: 4 } });
const HideIcon = chakra(EyeSlashIcon, { baseStyle: { w: 4, h: 4 } });
const SendIcon = chakra(PaperAirplaneIcon, { baseStyle: { w: 4, h: 4 } });

interface NotifEvent {
  key: string;
  label: string;
  description: string;
  enabled: boolean;
  template: string;
}

const defaultEvents: NotifEvent[] = [
  { key: "user_expired", label: "Kullanıcı Süresi Doldu", description: "Bir kullanıcının aboneliği sona erdiğinde", enabled: true, template: "⏰ *{username}* kullanıcısının süresi doldu." },
  { key: "data_limit", label: "Data Limiti Doldu", description: "Kullanıcı data limitine ulaştığında", enabled: true, template: "📊 *{username}* data limitine ulaştı ({used}/{limit})." },
  { key: "node_down", label: "Node Çevrimdışı", description: "Bir node bağlantısı kesildiğinde", enabled: true, template: "🔴 Node *{node_name}* çevrimdışı oldu!" },
  { key: "node_up", label: "Node Çevrimiçi", description: "Node yeniden bağlandığında", enabled: false, template: "🟢 Node *{node_name}* yeniden çevrimiçi." },
  { key: "user_created", label: "Yeni Kullanıcı", description: "Yeni kullanıcı oluşturulduğunda", enabled: false, template: "👤 Yeni kullanıcı: *{username}* ({plan} planı)" },
  { key: "high_cpu", label: "Yüksek CPU", description: "CPU kullanımı %90 üzerine çıktığında", enabled: true, template: "🔥 Yüksek CPU kullanımı: *{cpu_usage}%*" },
  { key: "expiry_warning", label: "Süre Uyarısı", description: "Kullanıcı süresinin dolmasına 3 gün kala", enabled: true, template: "⚠️ *{username}* hesabı {days} gün içinde dolacak." },
  { key: "admin_login", label: "Admin Girişi", description: "Bir admin giriş yaptığında", enabled: false, template: "🔑 Admin *{admin}* giriş yaptı. IP: {ip}" },
];

const COMMANDS = [
  { cmd: "/start", desc: "Bota başlama ve yetkilendirme" },
  { cmd: "/status", desc: "Sistem durumunu görüntüle (CPU, RAM, aktif kullanıcı)" },
  { cmd: "/users", desc: "Son eklenen 10 kullanıcıyı listele" },
  { cmd: "/user <username>", desc: "Belirli bir kullanıcının bilgilerini göster" },
  { cmd: "/extend <username> <days>", desc: "Kullanıcı süresini uzat" },
  { cmd: "/suspend <username>", desc: "Kullanıcıyı deaktif et" },
  { cmd: "/nodes", desc: "Node durumlarını listele" },
  { cmd: "/backup", desc: "Manuel yedek al ve DM'e gönder" },
  { cmd: "/stats", desc: "Detaylı istatistikleri göster" },
];

export const TelegramBot: FC = () => {
  const [botToken, setBotToken] = useState("7412345678:AAF_demo_token_xprobego_bot");
  const [showToken, setShowToken] = useState(false);
  const [chatIds, setChatIds] = useState("-100123456789, 987654321");
  const [adminChatId, setAdminChatId] = useState("123456789");
  const [botActive, setBotActive] = useState(true);
  const [events, setEvents] = useState<NotifEvent[]>(defaultEvents);
  const [editingTemplate, setEditingTemplate] = useState<string | null>(null);
  const toast = useToast();

  const toggleEvent = (key: string) => {
    setEvents((prev) => prev.map((e) => e.key === key ? { ...e, enabled: !e.enabled } : e));
  };

  const updateTemplate = (key: string, template: string) => {
    setEvents((prev) => prev.map((e) => e.key === key ? { ...e, template } : e));
  };

  const handleTest = () => {
    toast({
      title: "Test mesajı gönderildi",
      description: "Bot: ✅ X-Pro Bego bağlantısı başarılı!",
      status: "success",
      duration: 3000,
    });
  };

  const handleSave = () => {
    toast({ title: "Bot ayarları kaydedildi", status: "success", duration: 2000 });
  };

  return (
    <VStack w="full" minH="100vh" bg="gray.900" spacing={0}>
      <Box w="full" px={6} py={3} borderBottom="1px solid" borderColor="gray.700">
        <Header />
      </Box>
      <Box w="full" maxW="1000px" mx="auto" px={6} py={6}>
        <HStack justify="space-between" mb={6} flexWrap="wrap" gap={3}>
          <HStack>
            <Text fontSize="2xl">🤖</Text>
            <Heading size="md" color="white">Telegram Bot Entegrasyonu</Heading>
            <Badge colorScheme={botActive ? "green" : "red"}>{botActive ? "Aktif" : "Pasif"}</Badge>
          </HStack>
          <HStack>
            <Button size="sm" leftIcon={<SendIcon />} variant="outline" colorScheme="cyan" onClick={handleTest}>
              Test Gönder
            </Button>
            <Button size="sm" colorScheme="blue" onClick={handleSave}>
              Kaydet
            </Button>
          </HStack>
        </HStack>

        <Box bg="gray.800" borderRadius="xl" p={5} mb={5} border="1px solid" borderColor="gray.700">
          <HStack justify="space-between" mb={4}>
            <Text fontWeight="bold" color="white">Bot Ayarları</Text>
            <HStack>
              <Text fontSize="sm" color="gray.400">Bot Aktif</Text>
              <Switch isChecked={botActive} onChange={(e) => setBotActive(e.target.checked)} colorScheme="green" />
            </HStack>
          </HStack>
          <VStack spacing={4}>
            <FormControl>
              <FormLabel color="gray.400" fontSize="sm">Bot Token</FormLabel>
              <InputGroup>
                <Input
                  bg="gray.700" borderColor="gray.600" color="white" fontFamily="mono"
                  type={showToken ? "text" : "password"}
                  value={botToken}
                  onChange={(e) => setBotToken(e.target.value)}
                  placeholder="1234567890:AAF..."
                />
                <InputRightElement>
                  <Button size="xs" variant="ghost" onClick={() => setShowToken(!showToken)}>
                    {showToken ? <HideIcon /> : <ShowIcon />}
                  </Button>
                </InputRightElement>
              </InputGroup>
              <FormHelperText color="gray.500" fontSize="xs">@BotFather'dan alınan token</FormHelperText>
            </FormControl>
            <HStack w="full">
              <FormControl>
                <FormLabel color="gray.400" fontSize="sm">Bildirim Chat ID'leri (virgülle ayır)</FormLabel>
                <Input bg="gray.700" borderColor="gray.600" color="white" fontFamily="mono" value={chatIds} onChange={(e) => setChatIds(e.target.value)} placeholder="-100..., 123..." />
                <FormHelperText color="gray.500" fontSize="xs">Grup veya kullanıcı Chat ID'leri</FormHelperText>
              </FormControl>
              <FormControl>
                <FormLabel color="gray.400" fontSize="sm">Admin Chat ID</FormLabel>
                <Input bg="gray.700" borderColor="gray.600" color="white" fontFamily="mono" value={adminChatId} onChange={(e) => setAdminChatId(e.target.value)} placeholder="123..." />
                <FormHelperText color="gray.500" fontSize="xs">Bot komutlarına yetkili ID</FormHelperText>
              </FormControl>
            </HStack>
          </VStack>
        </Box>

        <Box bg="gray.800" borderRadius="xl" p={5} mb={5} border="1px solid" borderColor="gray.700">
          <Text fontWeight="bold" color="white" mb={4}>🔔 Bildirim Olayları</Text>
          <VStack spacing={3} align="stretch">
            {events.map((e) => (
              <Box key={e.key}>
                <HStack justify="space-between" mb={1}>
                  <VStack align="start" spacing={0}>
                    <HStack>
                      <Text color="white" fontSize="sm" fontWeight="medium">{e.label}</Text>
                      {e.enabled && <Badge colorScheme="green" fontSize="2xs">Aktif</Badge>}
                    </HStack>
                    <Text color="gray.500" fontSize="xs">{e.description}</Text>
                  </VStack>
                  <HStack>
                    <Button size="xs" variant="ghost" colorScheme="blue" onClick={() => setEditingTemplate(editingTemplate === e.key ? null : e.key)}>
                      Şablon
                    </Button>
                    <Switch isChecked={e.enabled} onChange={() => toggleEvent(e.key)} colorScheme="green" size="sm" />
                  </HStack>
                </HStack>
                {editingTemplate === e.key && (
                  <Textarea
                    bg="gray.700" borderColor="gray.600" color="gray.300" fontSize="xs" fontFamily="mono"
                    value={e.template} rows={2} mt={1}
                    onChange={(ev) => updateTemplate(e.key, ev.target.value)}
                  />
                )}
                <Divider borderColor="gray.700" mt={2} />
              </Box>
            ))}
          </VStack>
        </Box>

        <Box bg="gray.800" borderRadius="xl" p={5} border="1px solid" borderColor="gray.700">
          <Text fontWeight="bold" color="white" mb={4}>📋 Bot Komutları</Text>
          <Table size="sm" variant="unstyled">
            <Thead>
              <Tr>
                <Th color="gray.400" fontSize="xs">Komut</Th>
                <Th color="gray.400" fontSize="xs">Açıklama</Th>
              </Tr>
            </Thead>
            <Tbody>
              {COMMANDS.map((c) => (
                <Tr key={c.cmd} borderTop="1px solid" borderColor="gray.700">
                  <Td py={2}>
                    <Text fontFamily="mono" color="cyan.400" fontSize="sm">{c.cmd}</Text>
                  </Td>
                  <Td>
                    <Text color="gray.300" fontSize="sm">{c.desc}</Text>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </Box>
      </Box>
    </VStack>
  );
};
