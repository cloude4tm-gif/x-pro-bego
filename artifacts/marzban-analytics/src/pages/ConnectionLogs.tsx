import {
  Badge,
  Box,
  Divider,
  HStack,
  Heading,
  Input,
  InputGroup,
  InputLeftElement,
  Spinner,
  Table,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tooltip,
  Tr,
  VStack,
  useToast,
} from "@chakra-ui/react";
import { GlobeAltIcon, MagnifyingGlassIcon, SignalIcon } from "@heroicons/react/24/outline";
import { chakra } from "@chakra-ui/react";
import { Footer } from "components/Footer";
import { Header } from "components/Header";
import { FC, useEffect, useMemo, useState } from "react";
import { fetch } from "service/http";

const GlobeIcon = chakra(GlobeAltIcon, { baseStyle: { w: 4, h: 4 } });
const SignIcon = chakra(SignalIcon, { baseStyle: { w: 4, h: 4 } });

const COUNTRY_FLAGS: Record<string, string> = {
  TR: "🇹🇷",
  DE: "🇩🇪",
  NL: "🇳🇱",
  US: "🇺🇸",
  IR: "🇮🇷",
  RU: "🇷🇺",
  GB: "🇬🇧",
  FR: "🇫🇷",
  AE: "🇦🇪",
  CN: "🇨🇳",
};

type ConnectionLog = {
  username: string;
  ip: string;
  country_code: string;
  country_name: string;
  city: string;
  device: string;
  os: string;
  last_seen: string;
  node: string;
  status: "online" | "offline";
};

const timeAgo = (isoDate: string) => {
  const diff = Math.floor((Date.now() - new Date(isoDate).getTime()) / 1000);
  if (diff < 60) return `${diff}s önce`;
  if (diff < 3600) return `${Math.floor(diff / 60)}dk önce`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}sa önce`;
  return `${Math.floor(diff / 86400)}g önce`;
};

export const ConnectionLogs: FC = () => {
  const [logs, setLogs] = useState<ConnectionLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const toast = useToast();

  useEffect(() => {
    setLoading(true);
    fetch("/users/connections")
      .then((data: any) => {
        if (Array.isArray(data)) setLogs(data);
      })
      .catch(() => {
        toast({ title: "Bağlantı logları yüklenemedi", status: "error", duration: 3000 });
      })
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(
    () =>
      logs.filter(
        (l) =>
          l.username.toLowerCase().includes(search.toLowerCase()) ||
          l.ip.includes(search) ||
          l.country_name.toLowerCase().includes(search.toLowerCase())
      ),
    [logs, search]
  );

  const onlineCount = logs.filter((l) => l.status === "online").length;

  return (
    <VStack justifyContent="space-between" minH="100vh" p="6" rowGap={4}>
      <Box w="full">
        <Header />
        <Box mt={6}>
          <HStack mb={2} justify="space-between">
            <HStack>
              <GlobeIcon />
              <Heading size="md">Connection Logs</Heading>
            </HStack>
            <HStack spacing={3}>
              <HStack spacing={1}>
                <SignIcon color="green.400" />
                <Text fontSize="sm" color="green.400" fontWeight="bold">
                  {onlineCount} Online
                </Text>
              </HStack>
              <Text fontSize="sm" color="gray.500">
                Toplam: {logs.length} kullanıcı
              </Text>
            </HStack>
          </HStack>
          <Text fontSize="sm" color="gray.500" mb={4}>
            Kullanıcıların bağlandığı ülke, cihaz ve IP bilgileri
          </Text>
          <Divider mb={4} />

          <InputGroup mb={4} maxW="400px">
            <InputLeftElement pointerEvents="none">
              <chakra.span color="gray.400" fontSize="sm">
                <MagnifyingGlassIcon style={{ width: 16, height: 16 }} />
              </chakra.span>
            </InputLeftElement>
            <Input
              placeholder="Kullanıcı, IP veya ülke ara..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              _dark={{ borderColor: "gray.600" }}
            />
          </InputGroup>

          {loading ? (
            <HStack justify="center" py={10}>
              <Spinner />
            </HStack>
          ) : (
            <Box overflowX="auto" borderRadius="lg" borderWidth={1} _dark={{ borderColor: "gray.600" }}>
              <Table variant="simple" size="sm">
                <Thead>
                  <Tr>
                    <Th>Kullanıcı</Th>
                    <Th>Durum</Th>
                    <Th>IP Adresi</Th>
                    <Th>Ülke</Th>
                    <Th>Şehir</Th>
                    <Th>Cihaz / OS</Th>
                    <Th>Node</Th>
                    <Th>Son Görülme</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {filtered.length === 0 ? (
                    <Tr>
                      <Td colSpan={8}>
                        <Text textAlign="center" color="gray.500" py={4}>
                          Kayıt bulunamadı
                        </Text>
                      </Td>
                    </Tr>
                  ) : (
                    filtered.map((log, idx) => (
                      <Tr key={idx}>
                        <Td fontWeight="semibold">{log.username}</Td>
                        <Td>
                          <Badge
                            colorScheme={log.status === "online" ? "green" : "gray"}
                            variant="subtle"
                          >
                            {log.status === "online" ? "🟢 Online" : "⚫ Offline"}
                          </Badge>
                        </Td>
                        <Td fontFamily="mono" fontSize="xs">
                          {log.ip}
                        </Td>
                        <Td>
                          <HStack spacing={1}>
                            <Text>{COUNTRY_FLAGS[log.country_code] || "🌍"}</Text>
                            <Text>{log.country_name}</Text>
                          </HStack>
                        </Td>
                        <Td>{log.city}</Td>
                        <Td>
                          <Tooltip label={log.os}>
                            <Text fontSize="xs">{log.device}</Text>
                          </Tooltip>
                        </Td>
                        <Td fontSize="xs">{log.node}</Td>
                        <Td fontSize="xs" color="gray.500">
                          {timeAgo(log.last_seen)}
                        </Td>
                      </Tr>
                    ))
                  )}
                </Tbody>
              </Table>
            </Box>
          )}
        </Box>
      </Box>
      <Footer />
    </VStack>
  );
};

export default ConnectionLogs;
