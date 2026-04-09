import {
  Badge,
  Box,
  Button,
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
  NumberInput,
  NumberInputField,
  Progress,
  Select,
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
  BanknotesIcon,
  PencilIcon,
  PlusIcon,
  TrashIcon,
  UserGroupIcon,
} from "@heroicons/react/24/outline";
import { chakra } from "@chakra-ui/react";
import { FC, useState } from "react";
import { Header } from "components/Header";

const EditIcon = chakra(PencilIcon, { baseStyle: { w: 4, h: 4 } });
const DeleteIcon = chakra(TrashIcon, { baseStyle: { w: 4, h: 4 } });
const AddIcon = chakra(PlusIcon, { baseStyle: { w: 4, h: 4 } });

type Role = "sudo" | "admin" | "reseller" | "sub-reseller";

interface Reseller {
  id: number;
  username: string;
  email: string;
  role: Role;
  parent?: string;
  balance: number;
  usersCreated: number;
  usersLimit: number;
  commissionRate: number;
  totalEarned: number;
  active: boolean;
}

const initialResellers: Reseller[] = [
  { id: 1, username: "sudo_root", email: "root@xprobego.com", role: "sudo", balance: 0, usersCreated: 0, usersLimit: 0, commissionRate: 0, totalEarned: 0, active: true },
  { id: 2, username: "admin_ali", email: "ali@reseller.com", role: "admin", balance: 250.0, usersCreated: 85, usersLimit: 200, commissionRate: 20, totalEarned: 1200, active: true },
  { id: 3, username: "reseller_mehmet", email: "mehmet@panel.net", role: "reseller", parent: "admin_ali", balance: 80.5, usersCreated: 32, usersLimit: 50, commissionRate: 15, totalEarned: 480, active: true },
  { id: 4, username: "reseller_zeynep", email: "zeynep@vpn.co", role: "reseller", parent: "admin_ali", balance: 120.0, usersCreated: 45, usersLimit: 100, commissionRate: 15, totalEarned: 675, active: true },
  { id: 5, username: "sub_can", email: "can@sub.net", role: "sub-reseller", parent: "reseller_mehmet", balance: 20.0, usersCreated: 8, usersLimit: 20, commissionRate: 10, totalEarned: 80, active: false },
];

const roleColors: Record<Role, string> = {
  sudo: "red",
  admin: "purple",
  reseller: "blue",
  "sub-reseller": "green",
};

const roleLabels: Record<Role, string> = {
  sudo: "🔑 Sudo",
  admin: "👑 Admin",
  reseller: "🏪 Reseller",
  "sub-reseller": "🤝 Sub-Reseller",
};

export const ResellerManager: FC = () => {
  const [resellers, setResellers] = useState<Reseller[]>(initialResellers);
  const [editing, setEditing] = useState<Reseller | null>(null);
  const [addBalance, setAddBalance] = useState({ id: 0, amount: 0 });
  const [form, setForm] = useState<Partial<Reseller>>({});
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { isOpen: isBalOpen, onOpen: onBalOpen, onClose: onBalClose } = useDisclosure();
  const toast = useToast();

  const openEdit = (r: Reseller) => {
    setEditing(r);
    setForm({ ...r });
    onOpen();
  };

  const openCreate = () => {
    setEditing(null);
    setForm({ role: "reseller", commissionRate: 15, usersLimit: 50, active: true, balance: 0, usersCreated: 0, totalEarned: 0 });
    onOpen();
  };

  const handleSave = () => {
    if (!form.username) return;
    if (editing) {
      setResellers((prev) => prev.map((r) => (r.id === editing.id ? { ...r, ...form } as Reseller : r)));
      toast({ title: "Reseller güncellendi", status: "success", duration: 2000 });
    } else {
      const id = Math.max(...resellers.map((r) => r.id)) + 1;
      setResellers((prev) => [...prev, { id, ...form } as Reseller]);
      toast({ title: "Reseller oluşturuldu", status: "success", duration: 2000 });
    }
    onClose();
  };

  const handleDelete = (id: number) => {
    setResellers((prev) => prev.filter((r) => r.id !== id));
    toast({ title: "Reseller silindi", status: "info", duration: 2000 });
  };

  const handleAddBalance = () => {
    setResellers((prev) =>
      prev.map((r) => r.id === addBalance.id ? { ...r, balance: r.balance + addBalance.amount } : r)
    );
    toast({ title: `$${addBalance.amount} bakiye eklendi`, status: "success", duration: 2000 });
    onBalClose();
    setAddBalance({ id: 0, amount: 0 });
  };

  const totalBalance = resellers.reduce((s, r) => s + r.balance, 0);
  const totalUsers = resellers.reduce((s, r) => s + r.usersCreated, 0);
  const totalEarned = resellers.reduce((s, r) => s + r.totalEarned, 0);

  return (
    <VStack w="full" minH="100vh" bg="gray.900" spacing={0}>
      <Box w="full" px={6} py={3} borderBottom="1px solid" borderColor="gray.700">
        <Header />
      </Box>
      <Box w="full" maxW="1400px" mx="auto" px={6} py={6}>
        <HStack justify="space-between" mb={6} flexWrap="wrap" gap={3}>
          <HStack>
            <UserGroupIcon style={{ width: 24, height: 24, color: "#805AD5" }} />
            <Heading size="md" color="white">Reseller Yönetimi</Heading>
            <Badge colorScheme="purple" ml={2}>4 Katman Hiyerarşi</Badge>
          </HStack>
          <Button size="sm" leftIcon={<AddIcon />} colorScheme="purple" onClick={openCreate}>
            Yeni Reseller
          </Button>
        </HStack>

        <HStack mb={6} spacing={4} flexWrap="wrap">
          {[
            { label: "Toplam Bakiye", value: `$${totalBalance.toFixed(2)}`, color: "green.400" },
            { label: "Toplam Kullanıcı", value: totalUsers, color: "blue.400" },
            { label: "Toplam Komisyon", value: `$${totalEarned.toFixed(0)}`, color: "purple.400" },
            { label: "Aktif Reseller", value: resellers.filter((r) => r.active && r.role !== "sudo").length, color: "orange.400" },
          ].map(({ label, value, color }) => (
            <Box key={label} bg="gray.800" borderRadius="xl" p={4} border="1px solid" borderColor="gray.700" flex={1} minW="150px">
              <Text fontSize="xs" color="gray.400">{label}</Text>
              <Text fontSize="xl" fontWeight="bold" color={color}>{value}</Text>
            </Box>
          ))}
        </HStack>

        <Box bg="gray.800" borderRadius="xl" border="1px solid" borderColor="gray.700" overflow="hidden">
          <Table size="sm" variant="unstyled">
            <Thead>
              <Tr bg="gray.750">
                <Th color="gray.400" fontSize="xs" py={4} pl={4}>Kullanıcı</Th>
                <Th color="gray.400" fontSize="xs">Rol</Th>
                <Th color="gray.400" fontSize="xs">Üst Hesap</Th>
                <Th color="gray.400" fontSize="xs" isNumeric>Bakiye</Th>
                <Th color="gray.400" fontSize="xs">Kullanıcılar</Th>
                <Th color="gray.400" fontSize="xs" isNumeric>Komisyon</Th>
                <Th color="gray.400" fontSize="xs" isNumeric>Toplam Kazanç</Th>
                <Th color="gray.400" fontSize="xs">Durum</Th>
                <Th color="gray.400" fontSize="xs">İşlem</Th>
              </Tr>
            </Thead>
            <Tbody>
              {resellers.map((r) => (
                <Tr key={r.id} borderTop="1px solid" borderColor="gray.700" _hover={{ bg: "gray.750" }}>
                  <Td pl={4} py={3}>
                    <Text color="white" fontWeight="medium" fontSize="sm">{r.username}</Text>
                    <Text color="gray.500" fontSize="xs">{r.email}</Text>
                  </Td>
                  <Td>
                    <Badge colorScheme={roleColors[r.role]} fontSize="xs">{roleLabels[r.role]}</Badge>
                  </Td>
                  <Td>
                    <Text color="gray.400" fontSize="sm">{r.parent || "—"}</Text>
                  </Td>
                  <Td isNumeric>
                    <Text color="green.400" fontWeight="bold" fontSize="sm">${r.balance.toFixed(2)}</Text>
                  </Td>
                  <Td minW="140px">
                    {r.usersLimit > 0 ? (
                      <VStack align="start" spacing={1}>
                        <Text fontSize="xs" color="gray.300">{r.usersCreated} / {r.usersLimit}</Text>
                        <Progress value={(r.usersCreated / r.usersLimit) * 100} size="xs" w="100px" colorScheme="blue" borderRadius="full" />
                      </VStack>
                    ) : (
                      <Text fontSize="xs" color="gray.500">Sınırsız</Text>
                    )}
                  </Td>
                  <Td isNumeric>
                    <Text color="orange.400" fontSize="sm">{r.commissionRate}%</Text>
                  </Td>
                  <Td isNumeric>
                    <Text color="purple.400" fontWeight="bold" fontSize="sm">${r.totalEarned}</Text>
                  </Td>
                  <Td>
                    <Badge colorScheme={r.active ? "green" : "red"}>{r.active ? "Aktif" : "Pasif"}</Badge>
                  </Td>
                  <Td>
                    <HStack spacing={1}>
                      {r.role !== "sudo" && (
                        <Tooltip label="Bakiye Ekle">
                          <IconButton
                            size="xs"
                            icon={<BanknotesIcon style={{ width: 14, height: 14 }} />}
                            aria-label="Bakiye ekle"
                            colorScheme="green"
                            variant="ghost"
                            onClick={() => { setAddBalance({ id: r.id, amount: 10 }); onBalOpen(); }}
                          />
                        </Tooltip>
                      )}
                      <IconButton size="xs" icon={<EditIcon />} aria-label="Düzenle" variant="ghost" colorScheme="blue" onClick={() => openEdit(r)} />
                      {r.role !== "sudo" && (
                        <IconButton size="xs" icon={<DeleteIcon />} aria-label="Sil" variant="ghost" colorScheme="red" onClick={() => handleDelete(r.id)} />
                      )}
                    </HStack>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </Box>
      </Box>

      <Modal isOpen={isBalOpen} onClose={onBalClose} size="sm">
        <ModalOverlay backdropFilter="blur(6px)" />
        <ModalContent bg="gray.800" border="1px solid" borderColor="gray.700">
          <ModalHeader color="white">Bakiye Ekle</ModalHeader>
          <ModalCloseButton color="gray.400" />
          <ModalBody>
            <FormControl>
              <FormLabel color="gray.400" fontSize="sm">Eklenecek Tutar (USD)</FormLabel>
              <NumberInput min={1} value={addBalance.amount} onChange={(_, v) => setAddBalance((p) => ({ ...p, amount: v || 0 }))}>
                <NumberInputField bg="gray.700" borderColor="gray.600" color="white" />
              </NumberInput>
            </FormControl>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" color="gray.400" mr={3} onClick={onBalClose}>İptal</Button>
            <Button colorScheme="green" onClick={handleAddBalance}>Ekle</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <Modal isOpen={isOpen} onClose={onClose} size="md">
        <ModalOverlay backdropFilter="blur(6px)" />
        <ModalContent bg="gray.800" border="1px solid" borderColor="gray.700">
          <ModalHeader color="white">{editing ? "Reseller Düzenle" : "Yeni Reseller"}</ModalHeader>
          <ModalCloseButton color="gray.400" />
          <ModalBody>
            <VStack spacing={4}>
              <HStack w="full">
                <FormControl>
                  <FormLabel color="gray.400" fontSize="sm">Kullanıcı Adı</FormLabel>
                  <Input bg="gray.700" borderColor="gray.600" color="white" value={form.username || ""} onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))} />
                </FormControl>
                <FormControl>
                  <FormLabel color="gray.400" fontSize="sm">E-posta</FormLabel>
                  <Input bg="gray.700" borderColor="gray.600" color="white" type="email" value={form.email || ""} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
                </FormControl>
              </HStack>
              <HStack w="full">
                <FormControl>
                  <FormLabel color="gray.400" fontSize="sm">Rol</FormLabel>
                  <Select bg="gray.700" borderColor="gray.600" color="white" value={form.role || "reseller"} onChange={(e) => setForm((f) => ({ ...f, role: e.target.value as Role }))}>
                    <option value="admin">Admin</option>
                    <option value="reseller">Reseller</option>
                    <option value="sub-reseller">Sub-Reseller</option>
                  </Select>
                </FormControl>
                <FormControl>
                  <FormLabel color="gray.400" fontSize="sm">Komisyon (%)</FormLabel>
                  <NumberInput min={0} max={100} value={form.commissionRate || 0} onChange={(_, v) => setForm((f) => ({ ...f, commissionRate: v || 0 }))}>
                    <NumberInputField bg="gray.700" borderColor="gray.600" color="white" />
                  </NumberInput>
                </FormControl>
              </HStack>
              <FormControl>
                <FormLabel color="gray.400" fontSize="sm">Kullanıcı Limiti (0=Sınırsız)</FormLabel>
                <NumberInput min={0} value={form.usersLimit || 0} onChange={(_, v) => setForm((f) => ({ ...f, usersLimit: v || 0 }))}>
                  <NumberInputField bg="gray.700" borderColor="gray.600" color="white" />
                </NumberInput>
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" color="gray.400" mr={3} onClick={onClose}>İptal</Button>
            <Button colorScheme="purple" onClick={handleSave}>Kaydet</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </VStack>
  );
};
