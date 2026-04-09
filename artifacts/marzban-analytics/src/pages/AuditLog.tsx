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
  Table,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  VStack,
} from "@chakra-ui/react";
import {
  ArrowDownTrayIcon,
  ClipboardDocumentListIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";
import { chakra } from "@chakra-ui/react";
import { FC, useMemo, useState } from "react";
import { Header } from "components/Header";

const DlIcon = chakra(ArrowDownTrayIcon, { baseStyle: { w: 4, h: 4 } });
const SearchIcon = chakra(MagnifyingGlassIcon, { baseStyle: { w: 4, h: 4 } });

type ActionType = "user_create" | "user_delete" | "user_edit" | "admin_login" | "admin_logout" | "node_add" | "node_remove" | "settings_change" | "reset_usage" | "user_limit_change";

interface LogEntry {
  id: number;
  timestamp: string;
  admin: string;
  action: ActionType;
  target: string;
  ip: string;
  detail: string;
}

const ACTION_LABELS: Record<ActionType, { label: string; color: string }> = {
  user_create: { label: "👤 Kullanıcı Oluşturuldu", color: "green" },
  user_delete: { label: "🗑️ Kullanıcı Silindi", color: "red" },
  user_edit: { label: "✏️ Kullanıcı Düzenlendi", color: "blue" },
  admin_login: { label: "🔑 Giriş Yapıldı", color: "purple" },
  admin_logout: { label: "🚪 Çıkış Yapıldı", color: "gray" },
  node_add: { label: "🖥️ Node Eklendi", color: "cyan" },
  node_remove: { label: "❌ Node Kaldırıldı", color: "orange" },
  settings_change: { label: "⚙️ Ayar Değiştirildi", color: "yellow" },
  reset_usage: { label: "🔄 Kullanım Sıfırlandı", color: "teal" },
  user_limit_change: { label: "📊 Limit Değiştirildi", color: "pink" },
};

function randomIp() {
  return `${Math.floor(Math.random() * 200 + 10)}.${Math.floor(Math.random() * 254)}.${Math.floor(Math.random() * 254)}.${Math.floor(Math.random() * 254)}`;
}

function generateLogs(): LogEntry[] {
  const admins = ["sudo_root", "admin_ali", "admin_zeynep", "reseller_mehmet"];
  const actions: ActionType[] = ["user_create", "user_delete", "user_edit", "admin_login", "admin_logout", "node_add", "node_remove", "settings_change", "reset_usage", "user_limit_change"];
  const targets = ["ali_vip", "mehmet_pro", "test_user", "Node-TR-1", "Node-DE-1", "system", "global", "ayse_basic", "can_gold"];
  const details: Partial<Record<ActionType, string[]>> = {
    user_create: ["Bronze plan ile oluşturuldu", "Silver plan, 30 gün", "Gold plan, 100GB limit"],
    user_delete: ["Süresi doldu", "İstek üzerine silindi", "Abuse tespit edildi"],
    user_edit: ["Data limiti 50GB→100GB", "Süre 30 gün uzatıldı", "Inbound değiştirildi"],
    admin_login: ["Başarılı giriş", "2FA ile giriş"],
    settings_change: ["Xray config güncellendi", "Inbound eklendi", "DNS değiştirildi"],
  };

  return Array.from({ length: 80 }, (_, i) => {
    const action = actions[Math.floor(Math.random() * actions.length)];
    const d = new Date();
    d.setMinutes(d.getMinutes() - i * 18);
    return {
      id: i + 1,
      timestamp: d.toISOString().replace("T", " ").slice(0, 19),
      admin: admins[Math.floor(Math.random() * admins.length)],
      action,
      target: targets[Math.floor(Math.random() * targets.length)],
      ip: randomIp(),
      detail: (details[action] || [""])[Math.floor(Math.random() * (details[action]?.length || 1))],
    };
  });
}

const allLogs = generateLogs();

export const AuditLog: FC = () => {
  const [search, setSearch] = useState("");
  const [filterAdmin, setFilterAdmin] = useState("all");
  const [filterAction, setFilterAction] = useState("all");
  const [page, setPage] = useState(0);
  const PER_PAGE = 20;

  const admins = [...new Set(allLogs.map((l) => l.admin))];

  const filtered = useMemo(() => {
    return allLogs.filter((l) => {
      const matchSearch = !search || l.target.includes(search) || l.admin.includes(search) || l.ip.includes(search);
      const matchAdmin = filterAdmin === "all" || l.admin === filterAdmin;
      const matchAction = filterAction === "all" || l.action === filterAction;
      return matchSearch && matchAdmin && matchAction;
    });
  }, [search, filterAdmin, filterAction]);

  const paginated = filtered.slice(page * PER_PAGE, (page + 1) * PER_PAGE);
  const totalPages = Math.ceil(filtered.length / PER_PAGE);

  const exportCSV = () => {
    const header = "Zaman,Admin,İşlem,Hedef,IP,Detay\n";
    const rows = filtered.map((l) => `${l.timestamp},${l.admin},${ACTION_LABELS[l.action].label},${l.target},${l.ip},${l.detail}`).join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "audit_log.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <VStack w="full" minH="100vh" bg="gray.900" spacing={0}>
      <Box w="full" px={6} py={3} borderBottom="1px solid" borderColor="gray.700">
        <Header />
      </Box>
      <Box w="full" maxW="1300px" mx="auto" px={6} py={6}>
        <HStack justify="space-between" mb={6} flexWrap="wrap" gap={3}>
          <HStack>
            <ClipboardDocumentListIcon style={{ width: 24, height: 24, color: "#63B3ED" }} />
            <Heading size="md" color="white">Admin Denetim Logu</Heading>
            <Badge colorScheme="blue" ml={2}>{filtered.length} Kayıt</Badge>
          </HStack>
          <Button size="sm" leftIcon={<DlIcon />} colorScheme="green" onClick={exportCSV}>
            CSV İndir
          </Button>
        </HStack>

        <HStack mb={5} spacing={3} flexWrap="wrap">
          <InputGroup size="sm" maxW="250px">
            <InputLeftElement><SearchIcon color="gray.400" /></InputLeftElement>
            <Input bg="gray.800" borderColor="gray.600" color="white" placeholder="Kullanıcı, IP..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }} />
          </InputGroup>
          <Select size="sm" bg="gray.800" borderColor="gray.600" color="white" maxW="180px" value={filterAdmin} onChange={(e) => { setFilterAdmin(e.target.value); setPage(0); }}>
            <option value="all">Tüm Adminler</option>
            {admins.map((a) => <option key={a} value={a}>{a}</option>)}
          </Select>
          <Select size="sm" bg="gray.800" borderColor="gray.600" color="white" maxW="220px" value={filterAction} onChange={(e) => { setFilterAction(e.target.value); setPage(0); }}>
            <option value="all">Tüm İşlemler</option>
            {Object.entries(ACTION_LABELS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </Select>
        </HStack>

        <Box bg="gray.800" borderRadius="xl" border="1px solid" borderColor="gray.700" overflow="hidden" mb={4}>
          <Table size="sm" variant="unstyled">
            <Thead>
              <Tr bg="gray.750">
                <Th color="gray.400" fontSize="xs" py={4} pl={4}>Zaman</Th>
                <Th color="gray.400" fontSize="xs">Admin</Th>
                <Th color="gray.400" fontSize="xs">İşlem</Th>
                <Th color="gray.400" fontSize="xs">Hedef</Th>
                <Th color="gray.400" fontSize="xs">IP</Th>
                <Th color="gray.400" fontSize="xs">Detay</Th>
              </Tr>
            </Thead>
            <Tbody>
              {paginated.length === 0 ? (
                <Tr><Td colSpan={6} textAlign="center" py={8} color="gray.500">Kayıt bulunamadı</Td></Tr>
              ) : (
                paginated.map((l) => {
                  const act = ACTION_LABELS[l.action];
                  return (
                    <Tr key={l.id} borderTop="1px solid" borderColor="gray.700" _hover={{ bg: "gray.750" }}>
                      <Td pl={4} py={3}>
                        <Text fontFamily="mono" fontSize="xs" color="gray.400">{l.timestamp}</Text>
                      </Td>
                      <Td>
                        <Text fontSize="sm" color="white" fontWeight="medium">{l.admin}</Text>
                      </Td>
                      <Td>
                        <Badge colorScheme={act.color} fontSize="xs">{act.label}</Badge>
                      </Td>
                      <Td>
                        <Text fontSize="sm" color="gray.300">{l.target}</Text>
                      </Td>
                      <Td>
                        <Text fontSize="xs" fontFamily="mono" color="gray.500">{l.ip}</Text>
                      </Td>
                      <Td>
                        <Text fontSize="xs" color="gray.400">{l.detail}</Text>
                      </Td>
                    </Tr>
                  );
                })
              )}
            </Tbody>
          </Table>
        </Box>

        <HStack justify="center" spacing={2}>
          <Button size="xs" variant="outline" colorScheme="blue" onClick={() => setPage((p) => Math.max(0, p - 1))} isDisabled={page === 0}>
            ← Önceki
          </Button>
          <Text fontSize="sm" color="gray.400">{page + 1} / {totalPages || 1}</Text>
          <Button size="xs" variant="outline" colorScheme="blue" onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))} isDisabled={page >= totalPages - 1}>
            Sonraki →
          </Button>
        </HStack>
      </Box>
    </VStack>
  );
};
