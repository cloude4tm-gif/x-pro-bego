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
  Spinner,
  Tab,
  TabList,
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
import { PlusIcon, TrashIcon, ShieldCheckIcon, ShieldExclamationIcon } from "@heroicons/react/24/outline";
import { chakra } from "@chakra-ui/react";
import { FC, useEffect, useState } from "react";
import { Header } from "components/Header";
import { xpbApi } from "service/xpbApi";

const AddIcon = chakra(PlusIcon, { baseStyle: { w: 4, h: 4 } });
const DeleteIcon = chakra(TrashIcon, { baseStyle: { w: 4, h: 4 } });

const emptyForm = { ip: "", reason: "", country: "" };

export const IpManager: FC = () => {
  const [tabIndex, setTabIndex] = useState(0);
  const [whitelist, setWhitelist] = useState<any[]>([]);
  const [blacklist, setBlacklist] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState(emptyForm);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();

  const currentType = tabIndex === 0 ? "whitelist" : "blacklist";
  const currentList = tabIndex === 0 ? whitelist : blacklist;
  const setCurrentList = tabIndex === 0 ? setWhitelist : setBlacklist;

  const load = async () => {
    try {
      const [wl, bl] = await Promise.all([
        xpbApi.getIpRules("whitelist"),
        xpbApi.getIpRules("blacklist"),
      ]);
      setWhitelist(wl);
      setBlacklist(bl);
    } catch { /* ignore */ } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleAdd = async () => {
    if (!formData.ip) return;
    try {
      const rule = await xpbApi.createIpRule({ ...formData, type: currentType });
      setCurrentList(p => [...p, rule]);
      toast({ title: `${currentType === "whitelist" ? "Whitelist" : "Blacklist"}'e eklendi`, status: "success", duration: 2000 });
      setFormData(emptyForm);
      onClose();
    } catch (err: any) { toast({ title: "Hata", description: err.message, status: "error", duration: 3000 }); }
  };

  const handleDelete = async (id: number) => {
    try {
      await xpbApi.deleteIpRule(id);
      setCurrentList(p => p.filter(r => r.id !== id));
      toast({ title: "Kural silindi", status: "info", duration: 2000 });
    } catch (err: any) { toast({ title: "Hata", description: err.message, status: "error", duration: 3000 }); }
  };

  return (
    <VStack w="full" minH="100vh" bg="gray.900" spacing={0}>
      <Box w="full" px={6} py={3} borderBottom="1px solid" borderColor="gray.700"><Header /></Box>
      <Box w="full" maxW="1000px" mx="auto" px={6} py={6}>
        <HStack justify="space-between" mb={6} flexWrap="wrap" gap={3}>
          <HStack>
            {tabIndex === 0
              ? <ShieldCheckIcon style={{ width: 22, height: 22, color: "#68D391" }} />
              : <ShieldExclamationIcon style={{ width: 22, height: 22, color: "#FC8181" }} />}
            <Heading size="md" color="white">IP Yönetimi</Heading>
          </HStack>
          <Button size="sm" leftIcon={<AddIcon />} colorScheme={tabIndex === 0 ? "green" : "red"} onClick={() => { setFormData(emptyForm); onOpen(); }}>
            {tabIndex === 0 ? "Whitelist'e Ekle" : "Blacklist'e Ekle"}
          </Button>
        </HStack>

        <HStack mb={6} gap={4}>
          {[
            { label: "Whitelist", value: whitelist.length, color: "green.400" },
            { label: "Blacklist", value: blacklist.length, color: "red.400" },
          ].map(({ label, value, color }) => (
            <Box key={label} bg="gray.800" borderRadius="xl" p={4} flex={1} border="1px solid" borderColor="gray.700">
              <Text color="gray.400" fontSize="sm">{label}</Text>
              <Text color={color} fontSize="2xl" fontWeight="bold">{value} IP</Text>
            </Box>
          ))}
        </HStack>

        <Tabs index={tabIndex} onChange={setTabIndex} variant="soft-rounded" colorScheme={tabIndex === 0 ? "green" : "red"} mb={4}>
          <TabList bg="gray.800" p={1} borderRadius="xl" display="inline-flex">
            <Tab color="gray.400" _selected={{ color: "white", bg: "green.600" }}>🟢 Whitelist ({whitelist.length})</Tab>
            <Tab color="gray.400" _selected={{ color: "white", bg: "red.600" }}>🔴 Blacklist ({blacklist.length})</Tab>
          </TabList>
        </Tabs>

        {loading ? (
          <HStack justify="center" py={16}><Spinner color="blue.400" size="xl" /></HStack>
        ) : (
          <Box bg="gray.800" borderRadius="xl" overflow="hidden" border="1px solid" borderColor="gray.700">
            <Table variant="unstyled">
              <Thead bg="gray.750">
                <Tr>
                  {["IP Adresi", "Ülke", "Sebep", "Ekleyen", "Tarih", "Sil"].map(h => (
                    <Th key={h} color="gray.400" fontSize="xs" py={3}>{h}</Th>
                  ))}
                </Tr>
              </Thead>
              <Tbody>
                {currentList.length === 0 ? (
                  <Tr><Td colSpan={6} textAlign="center" py={10}><Text color="gray.500">Bu listede kayıt yok.</Text></Td></Tr>
                ) : currentList.map(rule => (
                  <Tr key={rule.id} borderTop="1px solid" borderColor="gray.700" _hover={{ bg: "gray.750" }}>
                    <Td py={3}><Text fontFamily="mono" color={tabIndex === 0 ? "green.300" : "red.300"}>{rule.ip}</Text></Td>
                    <Td><Text color="gray.400" fontSize="sm">{rule.country || "—"}</Text></Td>
                    <Td><Text color="gray.300" fontSize="sm">{rule.reason || "—"}</Text></Td>
                    <Td><Badge colorScheme="blue">{rule.addedBy || "admin"}</Badge></Td>
                    <Td><Text color="gray.500" fontSize="xs">{new Date(rule.createdAt).toLocaleDateString("tr-TR")}</Text></Td>
                    <Td><IconButton size="xs" icon={<DeleteIcon />} aria-label="Sil" colorScheme="red" variant="ghost" onClick={() => handleDelete(rule.id)} /></Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </Box>
        )}
      </Box>

      <Modal isOpen={isOpen} onClose={onClose} size="sm">
        <ModalOverlay backdropFilter="blur(6px)" />
        <ModalContent bg="gray.800" border="1px solid" borderColor="gray.700">
          <ModalHeader color="white">{currentType === "whitelist" ? "Whitelist'e Ekle" : "Blacklist'e Ekle"}</ModalHeader>
          <ModalCloseButton color="gray.400" />
          <ModalBody>
            <VStack spacing={4}>
              <FormControl>
                <FormLabel color="gray.400" fontSize="sm">IP Adresi / CIDR</FormLabel>
                <Input bg="gray.700" borderColor="gray.600" color="white" fontFamily="mono" placeholder="1.2.3.4 veya 10.0.0.0/24" value={formData.ip} onChange={e => setFormData(f => ({ ...f, ip: e.target.value }))} />
              </FormControl>
              <FormControl>
                <FormLabel color="gray.400" fontSize="sm">Ülke (opsiyonel)</FormLabel>
                <Input bg="gray.700" borderColor="gray.600" color="white" placeholder="TR, DE..." value={formData.country} onChange={e => setFormData(f => ({ ...f, country: e.target.value }))} />
              </FormControl>
              <FormControl>
                <FormLabel color="gray.400" fontSize="sm">Sebep</FormLabel>
                <Input bg="gray.700" borderColor="gray.600" color="white" placeholder="Güvenilir sunucu, spam bloğu..." value={formData.reason} onChange={e => setFormData(f => ({ ...f, reason: e.target.value }))} />
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" color="gray.400" mr={3} onClick={onClose}>İptal</Button>
            <Button colorScheme={currentType === "whitelist" ? "green" : "red"} onClick={handleAdd}>Ekle</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </VStack>
  );
};
