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
  Spinner,
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
import { EyeIcon, EyeSlashIcon, PaperAirplaneIcon } from "@heroicons/react/24/outline";
import { chakra } from "@chakra-ui/react";
import { FC, useEffect, useState } from "react";
import { Header } from "components/Header";
import { xpbApi } from "service/xpbApi";

const ShowIcon = chakra(EyeIcon, { baseStyle: { w: 4, h: 4 } });
const HideIcon = chakra(EyeSlashIcon, { baseStyle: { w: 4, h: 4 } });
const SendIcon = chakra(PaperAirplaneIcon, { baseStyle: { w: 4, h: 4 } });

const DEFAULT_TEMPLATES: Record<string, string> = {
  user_expired: "⏰ *{username}* kullanıcısının süresi doldu.",
  data_limit: "📊 *{username}* data limitine ulaştı ({used}/{limit}).",
  node_down: "🔴 Node *{node_name}* çevrimdışı oldu!",
  node_up: "🟢 Node *{node_name}* yeniden çevrimiçi.",
  user_created: "👤 Yeni kullanıcı: *{username}* ({plan} planı)",
  high_cpu: "🔥 Yüksek CPU kullanımı: *{cpu_usage}%*",
  expiry_warning: "⚠️ *{username}* hesabı {days} gün içinde dolacak.",
  admin_login: "🔑 Admin *{admin}* giriş yaptı. IP: {ip}",
};

const ALL_EVENTS = [
  { key: "user_expired", label: "Kullanıcı Süresi Doldu" },
  { key: "data_limit", label: "Data Limiti Doldu" },
  { key: "node_down", label: "Node Çevrimdışı" },
  { key: "node_up", label: "Node Çevrimiçi" },
  { key: "user_created", label: "Yeni Kullanıcı" },
  { key: "high_cpu", label: "Yüksek CPU" },
  { key: "expiry_warning", label: "Süre Uyarısı (3 gün)" },
  { key: "admin_login", label: "Admin Girişi" },
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
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [showToken, setShowToken] = useState(false);
  const [settings, setSettings] = useState({
    botToken: "", chatIds: "", adminChatId: "", botActive: false,
    enabledEvents: [] as string[], eventTemplates: { ...DEFAULT_TEMPLATES },
  });
  const [editingTemplate, setEditingTemplate] = useState<string | null>(null);
  const toast = useToast();

  useEffect(() => {
    xpbApi.getBotSettings().then(data => {
      setSettings({
        botToken: data.botToken || "",
        chatIds: data.chatIds || "",
        adminChatId: data.adminChatId || "",
        botActive: data.botActive || false,
        enabledEvents: data.enabledEvents || [],
        eventTemplates: { ...DEFAULT_TEMPLATES, ...(data.eventTemplates || {}) },
      });
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const toggleEvent = (key: string) => {
    setSettings(s => ({
      ...s,
      enabledEvents: s.enabledEvents.includes(key)
        ? s.enabledEvents.filter(e => e !== key)
        : [...s.enabledEvents, key],
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await xpbApi.saveBotSettings(settings);
      toast({ title: "Bot ayarları kaydedildi", status: "success", duration: 2000 });
    } catch (err: any) {
      toast({ title: "Hata", description: err.message, status: "error", duration: 3000 });
    } finally { setSaving(false); }
  };

  const handleTest = async () => {
    setTesting(true);
    try {
      await xpbApi.testBot();
      toast({ title: "Test mesajı gönderildi ✅", description: "Telegram'ı kontrol edin", status: "success", duration: 3000 });
    } catch (err: any) {
      toast({ title: "Hata", description: err.message, status: "error", duration: 4000 });
    } finally { setTesting(false); }
  };

  if (loading) return <VStack minH="100vh" bg="gray.900" justify="center"><Spinner color="blue.400" size="xl" /></VStack>;

  return (
    <VStack w="full" minH="100vh" bg="gray.900" spacing={0}>
      <Box w="full" px={6} py={3} borderBottom="1px solid" borderColor="gray.700"><Header /></Box>
      <Box w="full" maxW="1000px" mx="auto" px={6} py={6}>
        <HStack justify="space-between" mb={6} flexWrap="wrap" gap={3}>
          <HStack>
            <Text fontSize="2xl">🤖</Text>
            <Heading size="md" color="white">Telegram Bot Entegrasyonu</Heading>
            <Badge colorScheme={settings.botActive ? "green" : "red"}>{settings.botActive ? "Aktif" : "Pasif"}</Badge>
          </HStack>
          <HStack>
            <Button size="sm" leftIcon={<SendIcon />} variant="outline" colorScheme="cyan" onClick={handleTest} isLoading={testing}>Test Gönder</Button>
            <Button size="sm" colorScheme="blue" onClick={handleSave} isLoading={saving}>Kaydet</Button>
          </HStack>
        </HStack>

        <Box bg="gray.800" borderRadius="xl" p={5} mb={5} border="1px solid" borderColor="gray.700">
          <HStack justify="space-between" mb={4}>
            <Text fontWeight="bold" color="white">Bot Ayarları</Text>
            <HStack>
              <Text fontSize="sm" color="gray.400">Bot Aktif</Text>
              <Switch isChecked={settings.botActive} onChange={e => setSettings(s => ({ ...s, botActive: e.target.checked }))} colorScheme="green" />
            </HStack>
          </HStack>
          <VStack spacing={4}>
            <FormControl>
              <FormLabel color="gray.400" fontSize="sm">Bot Token</FormLabel>
              <InputGroup>
                <Input bg="gray.700" borderColor="gray.600" color="white" fontFamily="mono" type={showToken ? "text" : "password"} value={settings.botToken} onChange={e => setSettings(s => ({ ...s, botToken: e.target.value }))} placeholder="1234567890:AAF..." />
                <InputRightElement>
                  <Button size="xs" variant="ghost" onClick={() => setShowToken(!showToken)}>{showToken ? <HideIcon /> : <ShowIcon />}</Button>
                </InputRightElement>
              </InputGroup>
              <FormHelperText color="gray.500" fontSize="xs">@BotFather'dan alınan token</FormHelperText>
            </FormControl>
            <HStack w="full">
              <FormControl>
                <FormLabel color="gray.400" fontSize="sm">Bildirim Chat ID'leri (virgülle ayır)</FormLabel>
                <Input bg="gray.700" borderColor="gray.600" color="white" fontFamily="mono" value={settings.chatIds} onChange={e => setSettings(s => ({ ...s, chatIds: e.target.value }))} placeholder="-100..., 123..." />
              </FormControl>
              <FormControl>
                <FormLabel color="gray.400" fontSize="sm">Admin Chat ID</FormLabel>
                <Input bg="gray.700" borderColor="gray.600" color="white" fontFamily="mono" value={settings.adminChatId} onChange={e => setSettings(s => ({ ...s, adminChatId: e.target.value }))} placeholder="123..." />
              </FormControl>
            </HStack>
          </VStack>
        </Box>

        <Box bg="gray.800" borderRadius="xl" p={5} mb={5} border="1px solid" borderColor="gray.700">
          <Text fontWeight="bold" color="white" mb={4}>🔔 Bildirim Olayları</Text>
          <VStack spacing={3} align="stretch">
            {ALL_EVENTS.map(e => (
              <Box key={e.key}>
                <HStack justify="space-between" mb={1}>
                  <HStack>
                    <Text color="white" fontSize="sm" fontWeight="medium">{e.label}</Text>
                    {settings.enabledEvents.includes(e.key) && <Badge colorScheme="green" fontSize="2xs">Aktif</Badge>}
                  </HStack>
                  <HStack>
                    <Button size="xs" variant="ghost" colorScheme="blue" onClick={() => setEditingTemplate(editingTemplate === e.key ? null : e.key)}>Şablon</Button>
                    <Switch isChecked={settings.enabledEvents.includes(e.key)} onChange={() => toggleEvent(e.key)} colorScheme="green" size="sm" />
                  </HStack>
                </HStack>
                {editingTemplate === e.key && (
                  <Textarea bg="gray.700" borderColor="gray.600" color="gray.300" fontSize="xs" fontFamily="mono" value={settings.eventTemplates[e.key] || ""} rows={2} mt={1}
                    onChange={ev => setSettings(s => ({ ...s, eventTemplates: { ...s.eventTemplates, [e.key]: ev.target.value } }))} />
                )}
                <Divider borderColor="gray.700" mt={2} />
              </Box>
            ))}
          </VStack>
        </Box>

        <Box bg="gray.800" borderRadius="xl" p={5} border="1px solid" borderColor="gray.700">
          <Text fontWeight="bold" color="white" mb={4}>📋 Bot Komutları</Text>
          <Table size="sm" variant="unstyled">
            <Thead><Tr><Th color="gray.400" fontSize="xs">Komut</Th><Th color="gray.400" fontSize="xs">Açıklama</Th></Tr></Thead>
            <Tbody>
              {COMMANDS.map(c => (
                <Tr key={c.cmd} borderTop="1px solid" borderColor="gray.700">
                  <Td py={2}><Text fontFamily="mono" color="cyan.400" fontSize="sm">{c.cmd}</Text></Td>
                  <Td><Text color="gray.300" fontSize="sm">{c.desc}</Text></Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </Box>
      </Box>
    </VStack>
  );
};
