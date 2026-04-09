import {
  Badge,
  Box,
  Button,
  FormControl,
  FormLabel,
  Grid,
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
  NumberInput,
  NumberInputField,
  Select,
  Spinner,
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
import { PlusIcon, TrashIcon, BanknotesIcon, PencilIcon } from "@heroicons/react/24/outline";
import { chakra } from "@chakra-ui/react";
import { FC, useEffect, useState } from "react";
import { Header } from "components/Header";
import { xpbApi } from "service/xpbApi";

const AddIcon = chakra(PlusIcon, { baseStyle: { w: 4, h: 4 } });
const DeleteIcon = chakra(TrashIcon, { baseStyle: { w: 4, h: 4 } });
const MoneyIcon = chakra(BanknotesIcon, { baseStyle: { w: 4, h: 4 } });
const EditIcon = chakra(PencilIcon, { baseStyle: { w: 4, h: 4 } });

const ROLE_COLORS: Record<string, string> = { master: "purple", distributor: "blue", reseller: "green", sub_reseller: "yellow" };
const ROLE_LABELS: Record<string, string> = { master: "Master", distributor: "Dağıtıcı", reseller: "Bayi", sub_reseller: "Alt Bayi" };

const emptyForm = { username: "", email: "", role: "reseller", parent: "", commissionRate: 15, usersLimit: 50 };

export const ResellerManager: FC = () => {
  const [resellers, setResellers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<any>(emptyForm);
  const [balanceId, setBalanceId] = useState<number | null>(null);
  const [balanceAmount, setBalanceAmount] = useState(0);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { isOpen: isBalOpen, onOpen: onBalOpen, onClose: onBalClose } = useDisclosure();
  const toast = useToast();

  const load = async () => {
    try { const data = await xpbApi.getResellers(); setResellers(data); }
    catch { /* ignore */ } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => { setEditingId(null); setFormData(emptyForm); onOpen(); };
  const openEdit = (r: any) => {
    setEditingId(r.id);
    setFormData({ username: r.username, email: r.email, role: r.role, parent: r.parent || "", commissionRate: r.commissionRate, usersLimit: r.usersLimit });
    onOpen();
  };
  const openBalance = (id: number) => { setBalanceId(id); setBalanceAmount(0); onBalOpen(); };

  const handleSave = async () => {
    if (!formData.username) return;
    try {
      if (editingId) {
        const u = await xpbApi.updateReseller(editingId, formData);
        setResellers(p => p.map(r => r.id === editingId ? u : r));
        toast({ title: "Bayi güncellendi", status: "success", duration: 2000 });
      } else {
        const c = await xpbApi.createReseller(formData);
        setResellers(p => [...p, c]);
        toast({ title: "Bayi oluşturuldu", status: "success", duration: 2000 });
      }
      onClose();
    } catch (err: any) { toast({ title: "Hata", description: err.message, status: "error", duration: 3000 }); }
  };

  const handleAddBalance = async () => {
    if (!balanceId || balanceAmount === 0) return;
    try {
      const u = await xpbApi.addBalance(balanceId, balanceAmount);
      setResellers(p => p.map(r => r.id === balanceId ? u : r));
      toast({ title: `$${balanceAmount} bakiye işlemi yapıldı`, status: "success", duration: 2000 });
      onBalClose();
    } catch (err: any) { toast({ title: "Hata", description: err.message, status: "error", duration: 3000 }); }
  };

  const handleDelete = async (id: number) => {
    try { await xpbApi.deleteReseller(id); setResellers(p => p.filter(r => r.id !== id)); toast({ title: "Bayi silindi", status: "info", duration: 2000 }); }
    catch (err: any) { toast({ title: "Hata", description: err.message, status: "error", duration: 3000 }); }
  };

  const totalBalance = resellers.reduce((s, r) => s + (r.balance || 0), 0);
  const totalEarned = resellers.reduce((s, r) => s + (r.totalEarned || 0), 0);

  return (
    <VStack w="full" minH="100vh" bg="gray.900" spacing={0}>
      <Box w="full" px={6} py={3} borderBottom="1px solid" borderColor="gray.700"><Header /></Box>
      <Box w="full" maxW="1400px" mx="auto" px={6} py={6}>
        <HStack justify="space-between" mb={6} flexWrap="wrap" gap={3}>
          <HStack><MoneyIcon color="green.400" /><Heading size="md" color="white">Bayi Yönetimi</Heading></HStack>
          <Button size="sm" leftIcon={<AddIcon />} colorScheme="green" onClick={openCreate}>Yeni Bayi</Button>
        </HStack>

        <Grid templateColumns={{ base: "1fr", md: "repeat(4, 1fr)" }} gap={4} mb={6}>
          {[
            { label: "Toplam Bayi", value: resellers.length, color: "blue.400" },
            { label: "Aktif Bayiler", value: resellers.filter(r => r.active).length, color: "green.400" },
            { label: "Toplam Bakiye", value: `$${totalBalance.toFixed(2)}`, color: "yellow.400" },
            { label: "Toplam Kazanç", value: `$${totalEarned.toFixed(2)}`, color: "purple.400" },
          ].map(({ label, value, color }) => (
            <Box key={label} bg="gray.800" borderRadius="xl" p={4} border="1px solid" borderColor="gray.700">
              <Text color="gray.400" fontSize="sm">{label}</Text>
              <Text color={color} fontSize="2xl" fontWeight="bold">{value}</Text>
            </Box>
          ))}
        </Grid>

        {loading ? (
          <HStack justify="center" py={16}><Spinner color="green.400" size="xl" /></HStack>
        ) : (
          <Box bg="gray.800" borderRadius="xl" overflow="hidden" border="1px solid" borderColor="gray.700">
            <Table variant="unstyled">
              <Thead bg="gray.750">
                <Tr>
                  {["Kullanıcı Adı", "Rol", "Üst Bayi", "Bakiye", "Kullanıcılar", "Komisyon", "Durum", "İşlemler"].map(h => (
                    <Th key={h} color="gray.400" fontSize="xs" py={3}>{h}</Th>
                  ))}
                </Tr>
              </Thead>
              <Tbody>
                {resellers.length === 0 ? (
                  <Tr><Td colSpan={8} textAlign="center" py={10}><Text color="gray.500">Henüz bayi yok. İlk bayiyi ekleyin!</Text></Td></Tr>
                ) : (
                  resellers.map((r: any) => (
                    <Tr key={r.id} borderTop="1px solid" borderColor="gray.700" _hover={{ bg: "gray.750" }}>
                      <Td py={3}>
                        <HStack><Box w={2} h={2} borderRadius="full" bg={r.active ? "green.400" : "red.400"} /><Text color="white" fontWeight="medium">{r.username}</Text></HStack>
                        <Text color="gray.400" fontSize="xs">{r.email}</Text>
                      </Td>
                      <Td><Badge colorScheme={ROLE_COLORS[r.role] || "gray"}>{ROLE_LABELS[r.role] || r.role}</Badge></Td>
                      <Td><Text color="gray.400" fontSize="sm">{r.parent || "—"}</Text></Td>
                      <Td><Text color="yellow.400" fontWeight="bold">${(r.balance || 0).toFixed(2)}</Text></Td>
                      <Td><Text color="gray.300" fontSize="sm">{r.usersCreated}/{r.usersLimit}</Text></Td>
                      <Td><Text color="green.400">%{r.commissionRate}</Text></Td>
                      <Td><Badge colorScheme={r.active ? "green" : "red"}>{r.active ? "Aktif" : "Pasif"}</Badge></Td>
                      <Td>
                        <HStack spacing={1}>
                          <IconButton size="xs" icon={<MoneyIcon />} aria-label="Bakiye" colorScheme="yellow" variant="ghost" onClick={() => openBalance(r.id)} />
                          <IconButton size="xs" icon={<EditIcon />} aria-label="Düzenle" colorScheme="blue" variant="ghost" onClick={() => openEdit(r)} />
                          <IconButton size="xs" icon={<DeleteIcon />} aria-label="Sil" colorScheme="red" variant="ghost" onClick={() => handleDelete(r.id)} />
                        </HStack>
                      </Td>
                    </Tr>
                  ))
                )}
              </Tbody>
            </Table>
          </Box>
        )}
      </Box>

      <Modal isOpen={isOpen} onClose={onClose} size="md">
        <ModalOverlay backdropFilter="blur(6px)" />
        <ModalContent bg="gray.800" border="1px solid" borderColor="gray.700">
          <ModalHeader color="white">{editingId ? "Bayi Düzenle" : "Yeni Bayi"}</ModalHeader>
          <ModalCloseButton color="gray.400" />
          <ModalBody>
            <VStack spacing={4}>
              <HStack w="full">
                <FormControl>
                  <FormLabel color="gray.400" fontSize="sm">Kullanıcı Adı</FormLabel>
                  <Input bg="gray.700" borderColor="gray.600" color="white" value={formData.username} isReadOnly={!!editingId} onChange={e => setFormData((f: any) => ({ ...f, username: e.target.value }))} />
                </FormControl>
                <FormControl>
                  <FormLabel color="gray.400" fontSize="sm">E-posta</FormLabel>
                  <Input bg="gray.700" borderColor="gray.600" color="white" type="email" value={formData.email} onChange={e => setFormData((f: any) => ({ ...f, email: e.target.value }))} />
                </FormControl>
              </HStack>
              <HStack w="full">
                <FormControl>
                  <FormLabel color="gray.400" fontSize="sm">Rol</FormLabel>
                  <Select bg="gray.700" borderColor="gray.600" color="white" value={formData.role} onChange={e => setFormData((f: any) => ({ ...f, role: e.target.value }))}>
                    <option value="master">Master</option>
                    <option value="distributor">Dağıtıcı</option>
                    <option value="reseller">Bayi</option>
                    <option value="sub_reseller">Alt Bayi</option>
                  </Select>
                </FormControl>
                <FormControl>
                  <FormLabel color="gray.400" fontSize="sm">Üst Bayi</FormLabel>
                  <Select bg="gray.700" borderColor="gray.600" color="white" value={formData.parent} onChange={e => setFormData((f: any) => ({ ...f, parent: e.target.value }))}>
                    <option value="">— Yok —</option>
                    {resellers.filter(r => r.id !== editingId).map(r => <option key={r.id} value={r.username}>{r.username} ({ROLE_LABELS[r.role] || r.role})</option>)}
                  </Select>
                </FormControl>
              </HStack>
              <HStack w="full">
                <FormControl>
                  <FormLabel color="gray.400" fontSize="sm">Komisyon (%)</FormLabel>
                  <NumberInput min={0} max={100} value={formData.commissionRate} onChange={(_, v) => setFormData((f: any) => ({ ...f, commissionRate: v || 15 }))}>
                    <NumberInputField bg="gray.700" borderColor="gray.600" color="white" />
                  </NumberInput>
                </FormControl>
                <FormControl>
                  <FormLabel color="gray.400" fontSize="sm">Kullanıcı Limiti</FormLabel>
                  <NumberInput min={1} value={formData.usersLimit} onChange={(_, v) => setFormData((f: any) => ({ ...f, usersLimit: v || 50 }))}>
                    <NumberInputField bg="gray.700" borderColor="gray.600" color="white" />
                  </NumberInput>
                </FormControl>
              </HStack>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" color="gray.400" mr={3} onClick={onClose}>İptal</Button>
            <Button colorScheme="green" onClick={handleSave}>Kaydet</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <Modal isOpen={isBalOpen} onClose={onBalClose} size="sm">
        <ModalOverlay backdropFilter="blur(6px)" />
        <ModalContent bg="gray.800" border="1px solid" borderColor="gray.700">
          <ModalHeader color="white">Bakiye Ekle / Düş</ModalHeader>
          <ModalCloseButton color="gray.400" />
          <ModalBody>
            <FormControl>
              <FormLabel color="gray.400" fontSize="sm">Miktar (USD) — negatif değer düşer</FormLabel>
              <NumberInput value={balanceAmount} onChange={(_, v) => setBalanceAmount(v || 0)}>
                <NumberInputField bg="gray.700" borderColor="gray.600" color="white" />
              </NumberInput>
            </FormControl>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" color="gray.400" mr={3} onClick={onBalClose}>İptal</Button>
            <Button colorScheme="yellow" onClick={handleAddBalance}>Uygula</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </VStack>
  );
};
