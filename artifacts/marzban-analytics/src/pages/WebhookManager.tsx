import {
  Badge,
  Box,
  Button,
  Checkbox,
  CheckboxGroup,
  FormControl,
  FormHelperText,
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
  Spinner,
  Switch,
  Table,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  VStack,
  useDisclosure,
  useToast,
} from "@chakra-ui/react";
import { PlusIcon, TrashIcon, PencilIcon, PaperAirplaneIcon } from "@heroicons/react/24/outline";
import { chakra } from "@chakra-ui/react";
import { FC, useEffect, useState } from "react";
import { Header } from "components/Header";
import { xpbApi } from "service/xpbApi";

const AddIcon = chakra(PlusIcon, { baseStyle: { w: 4, h: 4 } });
const DeleteIcon = chakra(TrashIcon, { baseStyle: { w: 4, h: 4 } });
const EditIcon = chakra(PencilIcon, { baseStyle: { w: 4, h: 4 } });
const TestIcon = chakra(PaperAirplaneIcon, { baseStyle: { w: 4, h: 4 } });

const ALL_EVENTS = [
  "user.created", "user.expired", "user.data_limit", "user.deleted",
  "node.down", "node.up", "backup.created", "backup.failed",
  "admin.login", "suspicious.traffic", "system.alert",
];

const emptyForm = { name: "", url: "", secret: "", events: [] as string[], method: "POST", active: true };

export const WebhookManager: FC = () => {
  const [webhooks, setWebhooks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<any>(emptyForm);
  const [testingId, setTestingId] = useState<number | null>(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();

  const load = async () => {
    try { const data = await xpbApi.getWebhooks(); setWebhooks(data); }
    catch { /* ignore */ } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => { setEditingId(null); setFormData(emptyForm); onOpen(); };
  const openEdit = (w: any) => { setEditingId(w.id); setFormData({ name: w.name, url: w.url, secret: w.secret, events: w.events, method: w.method, active: w.active }); onOpen(); };

  const handleSave = async () => {
    if (!formData.name || !formData.url) return;
    try {
      if (editingId) {
        const u = await xpbApi.updateWebhook(editingId, formData);
        setWebhooks(p => p.map(w => w.id === editingId ? u : w));
        toast({ title: "Webhook güncellendi", status: "success", duration: 2000 });
      } else {
        const c = await xpbApi.createWebhook(formData);
        setWebhooks(p => [...p, c]);
        toast({ title: "Webhook oluşturuldu", status: "success", duration: 2000 });
      }
      onClose();
    } catch (err: any) { toast({ title: "Hata", description: err.message, status: "error", duration: 3000 }); }
  };

  const handleDelete = async (id: number) => {
    try { await xpbApi.deleteWebhook(id); setWebhooks(p => p.filter(w => w.id !== id)); toast({ title: "Webhook silindi", status: "info", duration: 2000 }); }
    catch (err: any) { toast({ title: "Hata", description: err.message, status: "error", duration: 3000 }); }
  };

  const handleTest = async (id: number) => {
    setTestingId(id);
    try {
      const r = await xpbApi.testWebhook(id);
      setWebhooks(p => p.map(w => w.id === id ? { ...w, lastStatus: r.status, lastTriggered: new Date().toISOString() } : w));
      toast({ title: `Test gönderildi — HTTP ${r.status}`, status: r.status >= 200 && r.status < 300 ? "success" : "warning", duration: 3000 });
    } catch (err: any) { toast({ title: "Hata", description: err.message, status: "error", duration: 3000 }); }
    finally { setTestingId(null); }
  };

  const toggleActive = async (w: any) => {
    try {
      const u = await xpbApi.updateWebhook(w.id, { ...w, active: !w.active });
      setWebhooks(p => p.map(wh => wh.id === w.id ? u : wh));
    } catch { /* ignore */ }
  };

  return (
    <VStack w="full" minH="100vh" bg="gray.900" spacing={0}>
      <Box w="full" px={6} py={3} borderBottom="1px solid" borderColor="gray.700"><Header /></Box>
      <Box w="full" maxW="1300px" mx="auto" px={6} py={6}>
        <HStack justify="space-between" mb={6} flexWrap="wrap" gap={3}>
          <HStack>
            <Text fontSize="xl">🔗</Text>
            <Heading size="md" color="white">Webhook Yönetimi</Heading>
          </HStack>
          <Button size="sm" leftIcon={<AddIcon />} colorScheme="orange" onClick={openCreate}>Yeni Webhook</Button>
        </HStack>

        <HStack mb={6} gap={4}>
          {[
            { label: "Toplam Webhook", value: webhooks.length, color: "blue.400" },
            { label: "Aktif", value: webhooks.filter(w => w.active).length, color: "green.400" },
            { label: "Toplam Tetiklenme", value: webhooks.reduce((s, w) => s + (w.triggerCount || 0), 0), color: "orange.400" },
          ].map(({ label, value, color }) => (
            <Box key={label} bg="gray.800" borderRadius="xl" p={4} flex={1} border="1px solid" borderColor="gray.700">
              <Text color="gray.400" fontSize="sm">{label}</Text>
              <Text color={color} fontSize="2xl" fontWeight="bold">{value}</Text>
            </Box>
          ))}
        </HStack>

        {loading ? (
          <HStack justify="center" py={16}><Spinner color="orange.400" size="xl" /></HStack>
        ) : (
          <Box bg="gray.800" borderRadius="xl" overflow="hidden" border="1px solid" borderColor="gray.700">
            <Table variant="unstyled">
              <Thead bg="gray.750">
                <Tr>
                  {["Ad", "URL", "Olaylar", "Tetiklenme", "Son Durum", "Aktif", "İşlemler"].map(h => (
                    <Th key={h} color="gray.400" fontSize="xs" py={3}>{h}</Th>
                  ))}
                </Tr>
              </Thead>
              <Tbody>
                {webhooks.length === 0 ? (
                  <Tr><Td colSpan={7} textAlign="center" py={10}><Text color="gray.500">Henüz webhook yok.</Text></Td></Tr>
                ) : webhooks.map(w => (
                  <Tr key={w.id} borderTop="1px solid" borderColor="gray.700" _hover={{ bg: "gray.750" }} opacity={w.active ? 1 : 0.6}>
                    <Td py={3}>
                      <Text color="white" fontWeight="medium">{w.name}</Text>
                      <Badge colorScheme="gray" fontSize="2xs">{w.method}</Badge>
                    </Td>
                    <Td maxW="200px">
                      <Text fontFamily="mono" color="cyan.400" fontSize="xs" isTruncated title={w.url}>{w.url}</Text>
                    </Td>
                    <Td>
                      <HStack flexWrap="wrap" gap={1}>
                        {(w.events || []).slice(0, 3).map((e: string) => <Badge key={e} colorScheme="purple" fontSize="2xs">{e}</Badge>)}
                        {(w.events || []).length > 3 && <Badge colorScheme="gray" fontSize="2xs">+{(w.events || []).length - 3}</Badge>}
                      </HStack>
                    </Td>
                    <Td><Text color="gray.400" fontSize="sm">{w.triggerCount || 0}x</Text></Td>
                    <Td>
                      {w.lastStatus ? (
                        <Badge colorScheme={w.lastStatus >= 200 && w.lastStatus < 300 ? "green" : "red"}>{w.lastStatus}</Badge>
                      ) : <Text color="gray.500" fontSize="xs">—</Text>}
                    </Td>
                    <Td><Switch isChecked={w.active} onChange={() => toggleActive(w)} colorScheme="green" /></Td>
                    <Td>
                      <HStack spacing={1}>
                        <IconButton size="xs" icon={<TestIcon />} aria-label="Test" colorScheme="cyan" variant="ghost" isLoading={testingId === w.id} onClick={() => handleTest(w.id)} />
                        <IconButton size="xs" icon={<EditIcon />} aria-label="Düzenle" colorScheme="blue" variant="ghost" onClick={() => openEdit(w)} />
                        <IconButton size="xs" icon={<DeleteIcon />} aria-label="Sil" colorScheme="red" variant="ghost" onClick={() => handleDelete(w.id)} />
                      </HStack>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </Box>
        )}
      </Box>

      <Modal isOpen={isOpen} onClose={onClose} size="lg">
        <ModalOverlay backdropFilter="blur(6px)" />
        <ModalContent bg="gray.800" border="1px solid" borderColor="gray.700">
          <ModalHeader color="white">{editingId ? "Webhook Düzenle" : "Yeni Webhook"}</ModalHeader>
          <ModalCloseButton color="gray.400" />
          <ModalBody>
            <VStack spacing={4}>
              <HStack w="full">
                <FormControl>
                  <FormLabel color="gray.400" fontSize="sm">Ad</FormLabel>
                  <Input bg="gray.700" borderColor="gray.600" color="white" value={formData.name} onChange={e => setFormData((f: any) => ({ ...f, name: e.target.value }))} />
                </FormControl>
                <FormControl flex="0 0 120px">
                  <FormLabel color="gray.400" fontSize="sm">Method</FormLabel>
                  <Select bg="gray.700" borderColor="gray.600" color="white" value={formData.method} onChange={e => setFormData((f: any) => ({ ...f, method: e.target.value }))}>
                    <option value="POST">POST</option>
                    <option value="GET">GET</option>
                    <option value="PUT">PUT</option>
                  </Select>
                </FormControl>
              </HStack>
              <FormControl>
                <FormLabel color="gray.400" fontSize="sm">URL</FormLabel>
                <Input bg="gray.700" borderColor="gray.600" color="white" fontFamily="mono" type="url" placeholder="https://..." value={formData.url} onChange={e => setFormData((f: any) => ({ ...f, url: e.target.value }))} />
              </FormControl>
              <FormControl>
                <FormLabel color="gray.400" fontSize="sm">Secret (opsiyonel)</FormLabel>
                <Input bg="gray.700" borderColor="gray.600" color="white" fontFamily="mono" type="password" value={formData.secret} onChange={e => setFormData((f: any) => ({ ...f, secret: e.target.value }))} />
                <FormHelperText color="gray.500" fontSize="xs">X-Secret header olarak gönderilir.</FormHelperText>
              </FormControl>
              <FormControl>
                <FormLabel color="gray.400" fontSize="sm">Olaylar</FormLabel>
                <CheckboxGroup value={formData.events} onChange={(v) => setFormData((f: any) => ({ ...f, events: v }))}>
                  <SimpleGrid columns={2} spacing={2}>
                    {ALL_EVENTS.map(ev => (
                      <Checkbox key={ev} value={ev} colorScheme="orange">
                        <Text color="gray.300" fontSize="xs">{ev}</Text>
                      </Checkbox>
                    ))}
                  </SimpleGrid>
                </CheckboxGroup>
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" color="gray.400" mr={3} onClick={onClose}>İptal</Button>
            <Button colorScheme="orange" onClick={handleSave}>Kaydet</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </VStack>
  );
};
