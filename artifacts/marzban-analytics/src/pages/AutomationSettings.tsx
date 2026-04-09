import {
  Badge,
  Box,
  Button,
  Divider,
  FormControl,
  FormHelperText,
  FormLabel,
  Grid,
  HStack,
  Heading,
  Input,
  NumberInput,
  NumberInputField,
  Select,
  Spinner,
  Switch,
  Text,
  Textarea,
  VStack,
  useToast,
} from "@chakra-ui/react";
import { BoltIcon, BellIcon, ArrowPathIcon, XCircleIcon } from "@heroicons/react/24/outline";
import { chakra } from "@chakra-ui/react";
import { FC, useEffect, useState } from "react";
import { Header } from "components/Header";
import { xpbApi } from "service/xpbApi";

const BoltIconC = chakra(BoltIcon, { baseStyle: { w: 5, h: 5 } });

const SectionCard: FC<{ title: string; icon: React.ReactNode; badge?: string; badgeColor?: string; children: React.ReactNode }> = ({ title, icon, badge, badgeColor, children }) => (
  <Box bg="gray.800" borderRadius="xl" p={5} border="1px solid" borderColor="gray.700">
    <HStack mb={4}>{icon}<Text fontWeight="bold" color="white" fontSize="md">{title}</Text>{badge && <Badge colorScheme={badgeColor || "blue"}>{badge}</Badge>}</HStack>
    <Divider borderColor="gray.700" mb={4} />
    {children}
  </Box>
);

export const AutomationSettings: FC = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<any>({
    autoRenewEnabled: false, autoRenewDaysBefore: 3, autoRenewDays: 30, autoRenewNotify: true,
    autoDeactivateEnabled: true, autoDeactivateGraceDays: 1, autoDeactivateNotify: true, autoDeleteAfterDays: 30,
    reminderEnabled: true, reminderDaysBefore: [7, 3, 1], reminderTemplate: "⚠️ Sayın {username}, hesabınızın süresi {days} gün içinde dolacak.",
    suspiciousTrafficEnabled: true, suspiciousThresholdGB: 100, suspiciousAction: "notify",
    notifyTelegram: true, notifyDiscord: false, notifyWebhook: true, notifyEmail: false,
  });
  const [reminderInput, setReminderInput] = useState("7, 3, 1");
  const toast = useToast();

  useEffect(() => {
    xpbApi.getAutomation().then(data => {
      setSettings(data);
      if (data.reminderDaysBefore) setReminderInput(data.reminderDaysBefore.join(", "));
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const update = (patch: any) => setSettings((s: any) => ({ ...s, ...patch }));

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = { ...settings };
      if (reminderInput) {
        payload.reminderDaysBefore = reminderInput.split(",").map((d: string) => parseInt(d.trim())).filter((d: number) => !isNaN(d));
      }
      const updated = await xpbApi.saveAutomation(payload);
      setSettings({ ...updated, reminderDaysBefore: updated.reminderDaysBefore || [] });
      toast({ title: "Otomasyon ayarları kaydedildi", status: "success", duration: 2000 });
    } catch (err: any) {
      toast({ title: "Hata", description: err.message, status: "error", duration: 3000 });
    } finally { setSaving(false); }
  };

  if (loading) return <VStack minH="100vh" bg="gray.900" justify="center"><Spinner color="blue.400" size="xl" /></VStack>;

  return (
    <VStack w="full" minH="100vh" bg="gray.900" spacing={0}>
      <Box w="full" px={6} py={3} borderBottom="1px solid" borderColor="gray.700"><Header /></Box>
      <Box w="full" maxW="1000px" mx="auto" px={6} py={6}>
        <HStack justify="space-between" mb={6} flexWrap="wrap" gap={3}>
          <HStack><BoltIconC color="yellow.400" /><Heading size="md" color="white">Otomasyon Ayarları</Heading></HStack>
          <Button colorScheme="blue" size="sm" onClick={handleSave} isLoading={saving}>Tüm Ayarları Kaydet</Button>
        </HStack>

        <Grid templateColumns={{ base: "1fr", lg: "1fr 1fr" }} gap={5}>
          <SectionCard title="Otomatik Uzatma" icon={<ArrowPathIcon style={{ width: 20, height: 20, color: "#68D391" }} />} badge={settings.autoRenewEnabled ? "Aktif" : "Pasif"} badgeColor={settings.autoRenewEnabled ? "green" : "gray"}>
            <VStack spacing={4} align="stretch">
              <HStack justify="space-between"><Text color="gray.300" fontSize="sm">Otomatik Uzatmayı Etkinleştir</Text><Switch isChecked={settings.autoRenewEnabled} onChange={e => update({ autoRenewEnabled: e.target.checked })} colorScheme="green" /></HStack>
              <FormControl isDisabled={!settings.autoRenewEnabled}>
                <FormLabel color="gray.400" fontSize="xs">Dolmadan kaç gün önce uzatılsın?</FormLabel>
                <NumberInput min={1} max={30} value={settings.autoRenewDaysBefore} onChange={(_, v) => update({ autoRenewDaysBefore: v || 3 })}><NumberInputField bg="gray.700" borderColor="gray.600" color="white" /></NumberInput>
              </FormControl>
              <FormControl isDisabled={!settings.autoRenewEnabled}>
                <FormLabel color="gray.400" fontSize="xs">Kaç gün uzatılsın?</FormLabel>
                <NumberInput min={1} value={settings.autoRenewDays} onChange={(_, v) => update({ autoRenewDays: v || 30 })}><NumberInputField bg="gray.700" borderColor="gray.600" color="white" /></NumberInput>
              </FormControl>
              <HStack justify="space-between" opacity={settings.autoRenewEnabled ? 1 : 0.5}><Text color="gray.300" fontSize="sm">Uzatma bildirimi gönder</Text><Switch isChecked={settings.autoRenewNotify} onChange={e => update({ autoRenewNotify: e.target.checked })} colorScheme="green" isDisabled={!settings.autoRenewEnabled} /></HStack>
            </VStack>
          </SectionCard>

          <SectionCard title="Otomatik Deaktif" icon={<XCircleIcon style={{ width: 20, height: 20, color: "#FC8181" }} />} badge={settings.autoDeactivateEnabled ? "Aktif" : "Pasif"} badgeColor={settings.autoDeactivateEnabled ? "green" : "gray"}>
            <VStack spacing={4} align="stretch">
              <HStack justify="space-between"><Text color="gray.300" fontSize="sm">Süresi dolunca deaktif et</Text><Switch isChecked={settings.autoDeactivateEnabled} onChange={e => update({ autoDeactivateEnabled: e.target.checked })} colorScheme="green" /></HStack>
              <FormControl isDisabled={!settings.autoDeactivateEnabled}>
                <FormLabel color="gray.400" fontSize="xs">Tolerans süresi (gün)</FormLabel>
                <NumberInput min={0} max={7} value={settings.autoDeactivateGraceDays} onChange={(_, v) => update({ autoDeactivateGraceDays: v || 0 })}><NumberInputField bg="gray.700" borderColor="gray.600" color="white" /></NumberInput>
                <FormHelperText color="gray.600" fontSize="xs">0 = anında deaktif</FormHelperText>
              </FormControl>
              <FormControl isDisabled={!settings.autoDeactivateEnabled}>
                <FormLabel color="gray.400" fontSize="xs">Kullanıcıyı tamamen sil (gün sonra, 0=asla)</FormLabel>
                <NumberInput min={0} value={settings.autoDeleteAfterDays} onChange={(_, v) => update({ autoDeleteAfterDays: v || 0 })}><NumberInputField bg="gray.700" borderColor="gray.600" color="white" /></NumberInput>
              </FormControl>
              <HStack justify="space-between" opacity={settings.autoDeactivateEnabled ? 1 : 0.5}><Text color="gray.300" fontSize="sm">Kullanıcıya bildirim gönder</Text><Switch isChecked={settings.autoDeactivateNotify} onChange={e => update({ autoDeactivateNotify: e.target.checked })} colorScheme="green" isDisabled={!settings.autoDeactivateEnabled} /></HStack>
            </VStack>
          </SectionCard>

          <SectionCard title="Akıllı Hatırlatma" icon={<BellIcon style={{ width: 20, height: 20, color: "#F6E05E" }} />} badge={settings.reminderEnabled ? "Aktif" : "Pasif"} badgeColor={settings.reminderEnabled ? "green" : "gray"}>
            <VStack spacing={4} align="stretch">
              <HStack justify="space-between"><Text color="gray.300" fontSize="sm">Hatırlatma Sistemi Aktif</Text><Switch isChecked={settings.reminderEnabled} onChange={e => update({ reminderEnabled: e.target.checked })} colorScheme="green" /></HStack>
              <FormControl isDisabled={!settings.reminderEnabled}>
                <FormLabel color="gray.400" fontSize="xs">Kaç gün kala hatırlat (virgülle)</FormLabel>
                <Input bg="gray.700" borderColor="gray.600" color="white" fontSize="sm" value={reminderInput} onChange={e => setReminderInput(e.target.value)} placeholder="7, 3, 1" />
              </FormControl>
              <FormControl isDisabled={!settings.reminderEnabled}>
                <FormLabel color="gray.400" fontSize="xs">Mesaj Şablonu</FormLabel>
                <Textarea bg="gray.700" borderColor="gray.600" color="gray.300" fontSize="xs" rows={3} value={settings.reminderTemplate} onChange={e => update({ reminderTemplate: e.target.value })} />
                <FormHelperText color="gray.600" fontSize="xs">{"Değişkenler: {username}, {days}, {plan}"}</FormHelperText>
              </FormControl>
            </VStack>
          </SectionCard>

          <SectionCard title="Şüpheli Trafik Tespiti" icon={<BoltIconC color="orange.400" />} badge={settings.suspiciousTrafficEnabled ? "Aktif" : "Pasif"} badgeColor={settings.suspiciousTrafficEnabled ? "orange" : "gray"}>
            <VStack spacing={4} align="stretch">
              <HStack justify="space-between"><Text color="gray.300" fontSize="sm">Anormal Trafik Tespiti</Text><Switch isChecked={settings.suspiciousTrafficEnabled} onChange={e => update({ suspiciousTrafficEnabled: e.target.checked })} colorScheme="orange" /></HStack>
              <FormControl isDisabled={!settings.suspiciousTrafficEnabled}>
                <FormLabel color="gray.400" fontSize="xs">24 saatte anormal eşiği (GB)</FormLabel>
                <NumberInput min={1} value={settings.suspiciousThresholdGB} onChange={(_, v) => update({ suspiciousThresholdGB: v || 50 })}><NumberInputField bg="gray.700" borderColor="gray.600" color="white" /></NumberInput>
              </FormControl>
              <FormControl isDisabled={!settings.suspiciousTrafficEnabled}>
                <FormLabel color="gray.400" fontSize="xs">Aksiyon</FormLabel>
                <Select bg="gray.700" borderColor="gray.600" color="white" value={settings.suspiciousAction} onChange={e => update({ suspiciousAction: e.target.value })}>
                  <option value="notify">Sadece Bildir</option>
                  <option value="suspend">Kullanıcıyı Askıya Al</option>
                  <option value="both">Bildir + Askıya Al</option>
                </Select>
              </FormControl>
            </VStack>
          </SectionCard>
        </Grid>

        <Box bg="gray.800" borderRadius="xl" p={5} mt={5} border="1px solid" borderColor="gray.700">
          <HStack mb={4}><BellIcon style={{ width: 20, height: 20, color: "#63B3ED" }} /><Text fontWeight="bold" color="white">Bildirim Kanalları</Text></HStack>
          <Divider borderColor="gray.700" mb={4} />
          <Grid templateColumns={{ base: "1fr 1fr", md: "repeat(4, 1fr)" }} gap={4}>
            {[
              { key: "notifyTelegram", label: "🤖 Telegram" },
              { key: "notifyDiscord", label: "💬 Discord" },
              { key: "notifyWebhook", label: "🔗 Webhook" },
              { key: "notifyEmail", label: "📧 E-posta" },
            ].map(({ key, label }) => (
              <Box key={key} bg="gray.700" borderRadius="lg" p={3} border="1px solid" borderColor={settings[key] ? "blue.600" : "gray.600"}>
                <HStack justify="space-between">
                  <Text color="gray.300" fontSize="sm">{label}</Text>
                  <Switch size="sm" isChecked={settings[key]} colorScheme="blue" onChange={e => update({ [key]: e.target.checked })} />
                </HStack>
              </Box>
            ))}
          </Grid>
        </Box>
      </Box>
    </VStack>
  );
};
