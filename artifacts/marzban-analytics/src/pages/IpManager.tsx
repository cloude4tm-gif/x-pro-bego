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
  Select,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
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
import {
  NoSymbolIcon,
  PlusIcon,
  ShieldCheckIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import { chakra } from "@chakra-ui/react";
import { FC, useState } from "react";
import { Header } from "components/Header";

const DeleteIcon = chakra(TrashIcon, { baseStyle: { w: 4, h: 4 } });
const AddIcon = chakra(PlusIcon, { baseStyle: { w: 4, h: 4 } });

interface IpEntry {
  id: number;
  ip: string;
  reason: string;
  addedBy: string;
  addedAt: string;
  country?: string;
}

const initialWhitelist: IpEntry[] = [
  { id: 1, ip: "185.100.0.0/24", reason: "Ofis ağı", addedBy: "admin", addedAt: "2026-01-15", country: "TR" },
  { id: 2, ip: "91.234.55.12", reason: "Ev IP - yönetici", addedBy: "sudo_root", addedAt: "2026-02-01", country: "DE" },
  { id: 3, ip: "10.0.0.0/8", reason: "İç ağ (Private)", addedBy: "admin", addedAt: "2026-03-10" },
];

const initialBlacklist: IpEntry[] = [
  { id: 1, ip: "45.142.212.0/24", reason: "Torrent istemcisi", addedBy: "admin", addedAt: "2026-02-20", country: "RU" },
  { id: 2, ip: "194.165.16.0/22", reason: "DDoS kaynağı", addedBy: "sudo_root", addedAt: "2026-03-05", country: "CN" },
  { id: 3, ip: "185.220.101.0/24", reason: "Tor exit node", addedBy: "admin", addedAt: "2026-03-18", country: "DE" },
  { id: 4, ip: "91.108.4.0/22", reason: "Telegram bot abuse", addedBy: "admin", addedAt: "2026-04-01", country: "NL" },
];

const IpTable: FC<{ entries: IpEntry[]; onDelete: (id: number) => void; colorScheme: string }> = ({ entries, onDelete, colorScheme }) => (
  <Box bg="gray.800" borderRadius="xl" border="1px solid" borderColor="gray.700" overflow="hidden">
    <Table size="sm" variant="unstyled">
      <Thead>
        <Tr bg="gray.750">
          <Th color="gray.400" fontSize="xs" py={4} pl={4}>IP / CIDR</Th>
          <Th color="gray.400" fontSize="xs">Ülke</Th>
          <Th color="gray.400" fontSize="xs">Sebep</Th>
          <Th color="gray.400" fontSize="xs">Ekleyen</Th>
          <Th color="gray.400" fontSize="xs">Tarih</Th>
          <Th color="gray.400" fontSize="xs">İşlem</Th>
        </Tr>
      </Thead>
      <Tbody>
        {entries.length === 0 ? (
          <Tr><Td colSpan={6} textAlign="center" py={8} color="gray.500">Kayıt yok</Td></Tr>
        ) : (
          entries.map((e) => (
            <Tr key={e.id} borderTop="1px solid" borderColor="gray.700" _hover={{ bg: "gray.750" }}>
              <Td pl={4} py={3}>
                <Text fontFamily="mono" color="white" fontSize="sm" fontWeight="medium">{e.ip}</Text>
              </Td>
              <Td>
                {e.country ? (
                  <Badge colorScheme="gray" fontSize="xs">{e.country}</Badge>
                ) : (
                  <Text color="gray.600" fontSize="xs">—</Text>
                )}
              </Td>
              <Td>
                <Text color="gray.300" fontSize="sm">{e.reason}</Text>
              </Td>
              <Td>
                <Text color="gray.400" fontSize="xs">{e.addedBy}</Text>
              </Td>
              <Td>
                <Text color="gray.500" fontSize="xs">{e.addedAt}</Text>
              </Td>
              <Td>
                <IconButton size="xs" icon={<DeleteIcon />} aria-label="Sil" variant="ghost" colorScheme="red" onClick={() => onDelete(e.id)} />
              </Td>
            </Tr>
          ))
        )}
      </Tbody>
    </Table>
  </Box>
);

export const IpManager: FC = () => {
  const [whitelist, setWhitelist] = useState<IpEntry[]>(initialWhitelist);
  const [blacklist, setBlacklist] = useState<IpEntry[]>(initialBlacklist);
  const [activeTab, setActiveTab] = useState(0);
  const [form, setForm] = useState({ ip: "", reason: "", country: "" });
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();

  const handleDelete = (id: number, type: "white" | "black") => {
    if (type === "white") setWhitelist((p) => p.filter((e) => e.id !== id));
    else setBlacklist((p) => p.filter((e) => e.id !== id));
    toast({ title: "Kaldırıldı", status: "info", duration: 1500 });
  };

  const handleAdd = () => {
    if (!form.ip) return;
    const entry: IpEntry = {
      id: Date.now(),
      ip: form.ip,
      reason: form.reason,
      country: form.country || undefined,
      addedBy: "admin",
      addedAt: new Date().toISOString().split("T")[0],
    };
    if (activeTab === 0) setWhitelist((p) => [...p, entry]);
    else setBlacklist((p) => [...p, entry]);
    toast({ title: `IP ${activeTab === 0 ? "whitelist" : "blacklist"}'e eklendi`, status: "success", duration: 2000 });
    setForm({ ip: "", reason: "", country: "" });
    onClose();
  };

  return (
    <VStack w="full" minH="100vh" bg="gray.900" spacing={0}>
      <Box w="full" px={6} py={3} borderBottom="1px solid" borderColor="gray.700">
        <Header />
      </Box>
      <Box w="full" maxW="1100px" mx="auto" px={6} py={6}>
        <HStack justify="space-between" mb={6} flexWrap="wrap" gap={3}>
          <HStack>
            <ShieldCheckIcon style={{ width: 24, height: 24, color: "#48BB78" }} />
            <Heading size="md" color="white">IP Yöneticisi</Heading>
          </HStack>
          <Button size="sm" leftIcon={<AddIcon />} colorScheme={activeTab === 0 ? "green" : "red"} onClick={onOpen}>
            {activeTab === 0 ? "Whitelist'e Ekle" : "Blacklist'e Ekle"}
          </Button>
        </HStack>

        <HStack mb={6} spacing={4}>
          <Box bg="gray.800" borderRadius="xl" p={4} border="1px solid" borderColor="green.700" flex={1}>
            <HStack>
              <ShieldCheckIcon style={{ width: 18, height: 18, color: "#48BB78" }} />
              <Text fontSize="xs" color="gray.400">Whitelist</Text>
            </HStack>
            <Text fontSize="xl" fontWeight="bold" color="green.400">{whitelist.length} Kayıt</Text>
            <Text fontSize="xs" color="gray.500">Admin paneline izinli IP'ler</Text>
          </Box>
          <Box bg="gray.800" borderRadius="xl" p={4} border="1px solid" borderColor="red.700" flex={1}>
            <HStack>
              <NoSymbolIcon style={{ width: 18, height: 18, color: "#FC8181" }} />
              <Text fontSize="xs" color="gray.400">Blacklist</Text>
            </HStack>
            <Text fontSize="xl" fontWeight="bold" color="red.400">{blacklist.length} Kayıt</Text>
            <Text fontSize="xs" color="gray.500">Engellenen IP / aralıklar</Text>
          </Box>
        </HStack>

        <Tabs colorScheme="blue" onChange={(idx) => setActiveTab(idx)}>
          <TabList borderColor="gray.700" mb={4}>
            <Tab color="gray.400" _selected={{ color: "green.400", borderColor: "green.400" }}>
              🟢 Whitelist ({whitelist.length})
            </Tab>
            <Tab color="gray.400" _selected={{ color: "red.400", borderColor: "red.400" }}>
              🔴 Blacklist ({blacklist.length})
            </Tab>
          </TabList>
          <TabPanels>
            <TabPanel p={0}>
              <IpTable entries={whitelist} onDelete={(id) => handleDelete(id, "white")} colorScheme="green" />
            </TabPanel>
            <TabPanel p={0}>
              <IpTable entries={blacklist} onDelete={(id) => handleDelete(id, "black")} colorScheme="red" />
            </TabPanel>
          </TabPanels>
        </Tabs>
      </Box>

      <Modal isOpen={isOpen} onClose={onClose} size="sm">
        <ModalOverlay backdropFilter="blur(6px)" />
        <ModalContent bg="gray.800" border="1px solid" borderColor="gray.700">
          <ModalHeader color="white">{activeTab === 0 ? "🟢 Whitelist'e Ekle" : "🔴 Blacklist'e Ekle"}</ModalHeader>
          <ModalCloseButton color="gray.400" />
          <ModalBody>
            <VStack spacing={4}>
              <FormControl isRequired>
                <FormLabel color="gray.400" fontSize="sm">IP Adresi veya CIDR</FormLabel>
                <Input bg="gray.700" borderColor="gray.600" color="white" fontFamily="mono" placeholder="192.168.1.1 veya 10.0.0.0/8" value={form.ip} onChange={(e) => setForm((f) => ({ ...f, ip: e.target.value }))} />
              </FormControl>
              <FormControl>
                <FormLabel color="gray.400" fontSize="sm">Sebep</FormLabel>
                <Input bg="gray.700" borderColor="gray.600" color="white" placeholder="Neden ekleniyor?" value={form.reason} onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))} />
              </FormControl>
              <FormControl>
                <FormLabel color="gray.400" fontSize="sm">Ülke Kodu (isteğe bağlı)</FormLabel>
                <Input bg="gray.700" borderColor="gray.600" color="white" placeholder="TR, DE, US..." maxLength={2} value={form.country} onChange={(e) => setForm((f) => ({ ...f, country: e.target.value.toUpperCase() }))} />
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" color="gray.400" mr={3} onClick={onClose}>İptal</Button>
            <Button colorScheme={activeTab === 0 ? "green" : "red"} onClick={handleAdd}>Ekle</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </VStack>
  );
};
