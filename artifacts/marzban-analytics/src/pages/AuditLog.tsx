import {
  Badge,
  Box,
  Button,
  HStack,
  Heading,
  Input,
  InputGroup,
  InputLeftElement,
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
  useToast,
} from "@chakra-ui/react";
import { MagnifyingGlassIcon, DocumentArrowDownIcon, ClipboardDocumentListIcon } from "@heroicons/react/24/outline";
import { chakra } from "@chakra-ui/react";
import { FC, useEffect, useState } from "react";
import { Header } from "components/Header";
import { xpbApi } from "service/xpbApi";

const SearchIcon = chakra(MagnifyingGlassIcon, { baseStyle: { w: 4, h: 4 } });
const CsvIcon = chakra(DocumentArrowDownIcon, { baseStyle: { w: 4, h: 4 } });
const LogIcon = chakra(ClipboardDocumentListIcon, { baseStyle: { w: 5, h: 5 } });

const ACTION_COLORS: Record<string, string> = {
  login: "blue", logout: "gray", create: "green", update: "yellow",
  delete: "red", view: "purple", export: "cyan", setting: "orange",
};

const ALL_ACTIONS = ["all", "login", "logout", "create", "update", "delete", "view", "export", "setting"];

export const AuditLog: FC = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [admins, setAdmins] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterAdmin, setFilterAdmin] = useState("all");
  const [filterAction, setFilterAction] = useState("all");
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 20;
  const toast = useToast();

  const load = async (reset = false) => {
    setLoading(true);
    try {
      const params: Record<string, string> = { limit: String(PAGE_SIZE), offset: String(reset ? 0 : page * PAGE_SIZE) };
      if (filterAdmin !== "all") params.admin = filterAdmin;
      if (filterAction !== "all") params.action = filterAction;
      if (search) params.search = search;
      const data = await xpbApi.getAuditLogs(params);
      setLogs(data.logs);
      setAdmins(data.admins);
      if (reset) setPage(0);
    } catch { /* ignore */ } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [filterAdmin, filterAction]);

  const handleSearch = () => { load(true); };

  const exportCsv = () => {
    const header = "ID,Admin,Aksiyon,Hedef,IP,Detay,Tarih";
    const rows = logs.map(l => `${l.id},"${l.admin}","${l.action}","${l.target}","${l.ip}","${l.detail}","${new Date(l.createdAt).toISOString()}"`).join("\n");
    const blob = new Blob([header + "\n" + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "audit_log.csv"; a.click();
    toast({ title: "CSV indirildi", status: "success", duration: 2000 });
  };

  const totalPages = Math.ceil(logs.length / PAGE_SIZE);
  const currentLogs = logs.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  return (
    <VStack w="full" minH="100vh" bg="gray.900" spacing={0}>
      <Box w="full" px={6} py={3} borderBottom="1px solid" borderColor="gray.700"><Header /></Box>
      <Box w="full" maxW="1400px" mx="auto" px={6} py={6}>
        <HStack justify="space-between" mb={6} flexWrap="wrap" gap={3}>
          <HStack><LogIcon color="purple.400" /><Heading size="md" color="white">Admin Denetim Logu</Heading></HStack>
          <Button size="sm" leftIcon={<CsvIcon />} variant="outline" colorScheme="green" onClick={exportCsv}>CSV İndir</Button>
        </HStack>

        <HStack mb={5} flexWrap="wrap" gap={3}>
          <InputGroup maxW="280px">
            <InputLeftElement pointerEvents="none"><SearchIcon color="gray.500" /></InputLeftElement>
            <Input bg="gray.800" borderColor="gray.600" color="white" placeholder="Kullanıcı/IP ara..." value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === "Enter" && handleSearch()} />
          </InputGroup>
          <Select bg="gray.800" borderColor="gray.600" color="white" maxW="160px" value={filterAdmin} onChange={e => setFilterAdmin(e.target.value)}>
            <option value="all">Tüm Adminler</option>
            {admins.map(a => <option key={a} value={a}>{a}</option>)}
          </Select>
          <Select bg="gray.800" borderColor="gray.600" color="white" maxW="160px" value={filterAction} onChange={e => setFilterAction(e.target.value)}>
            {ALL_ACTIONS.map(a => <option key={a} value={a}>{a === "all" ? "Tüm Aksiyonlar" : a}</option>)}
          </Select>
          <Button size="sm" colorScheme="blue" onClick={() => load(true)}>Filtrele</Button>
        </HStack>

        {loading ? (
          <HStack justify="center" py={16}><Spinner color="purple.400" size="xl" /></HStack>
        ) : (
          <>
            <Box bg="gray.800" borderRadius="xl" overflow="hidden" border="1px solid" borderColor="gray.700" mb={4}>
              <Table variant="unstyled">
                <Thead bg="gray.750">
                  <Tr>
                    {["ID", "Admin", "Aksiyon", "Hedef", "IP", "Detay", "Tarih"].map(h => (
                      <Th key={h} color="gray.400" fontSize="xs" py={3}>{h}</Th>
                    ))}
                  </Tr>
                </Thead>
                <Tbody>
                  {currentLogs.length === 0 ? (
                    <Tr><Td colSpan={7} textAlign="center" py={10}><Text color="gray.500">Log kaydı bulunamadı.</Text></Td></Tr>
                  ) : currentLogs.map(log => (
                    <Tr key={log.id} borderTop="1px solid" borderColor="gray.700" _hover={{ bg: "gray.750" }}>
                      <Td py={3}><Text color="gray.500" fontSize="xs">#{log.id}</Text></Td>
                      <Td><Text color="blue.400" fontSize="sm" fontWeight="medium">{log.admin}</Text></Td>
                      <Td><Badge colorScheme={ACTION_COLORS[log.action] || "gray"} fontSize="xs">{log.action}</Badge></Td>
                      <Td><Text color="white" fontSize="sm">{log.target || "—"}</Text></Td>
                      <Td><Text fontFamily="mono" color="gray.400" fontSize="xs">{log.ip || "—"}</Text></Td>
                      <Td maxW="200px"><Text color="gray.300" fontSize="xs" noOfLines={2}>{log.detail || "—"}</Text></Td>
                      <Td><Text color="gray.500" fontSize="xs" whiteSpace="nowrap">{new Date(log.createdAt).toLocaleString("tr-TR")}</Text></Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </Box>
            {logs.length > PAGE_SIZE && (
              <HStack justify="center" gap={2}>
                <Button size="sm" variant="outline" colorScheme="gray" isDisabled={page === 0} onClick={() => setPage(p => p - 1)}>← Önceki</Button>
                <Text color="gray.400" fontSize="sm">{page + 1} / {totalPages}</Text>
                <Button size="sm" variant="outline" colorScheme="gray" isDisabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>Sonraki →</Button>
              </HStack>
            )}
          </>
        )}
      </Box>
    </VStack>
  );
};
