import {
  Badge,
  Box,
  BoxProps,
  Card,
  Grid,
  GridItem,
  HStack,
  Progress,
  Text,
  Tooltip,
  VStack,
} from "@chakra-ui/react";
import {
  ArrowDownIcon,
  ArrowUpIcon,
  CpuChipIcon,
  ServerStackIcon,
  SignalIcon,
  UsersIcon,
} from "@heroicons/react/24/outline";
import { chakra } from "@chakra-ui/react";
import { useDashboard } from "contexts/DashboardContext";
import { FC } from "react";
import { useQuery } from "react-query";
import { fetch } from "service/http";
import { formatBytes, numberWithCommas } from "utils/formatByte";

const iconProps = { baseStyle: { w: 5, h: 5 } };
const UserIcon = chakra(UsersIcon, iconProps);
const CpuIcon = chakra(CpuChipIcon, iconProps);
const RamIcon = chakra(ServerStackIcon, iconProps);
const NetIcon = chakra(SignalIcon, iconProps);
const UpIcon = chakra(ArrowUpIcon, { baseStyle: { w: 3, h: 3 } });
const DownIcon = chakra(ArrowDownIcon, { baseStyle: { w: 3, h: 3 } });

type SystemData = {
  version: string;
  mem_total: number;
  mem_used: number;
  cpu_cores: number;
  cpu_usage: number;
  total_user: number;
  users_active: number;
  incoming_bandwidth: number;
  outgoing_bandwidth: number;
  incoming_bandwidth_speed: number;
  outgoing_bandwidth_speed: number;
};

const cardStyle = {
  borderWidth: "1px",
  borderStyle: "solid" as const,
  borderColor: "light-border",
  bg: "#F9FAFB",
  _dark: { borderColor: "gray.600", bg: "gray.750" },
  boxShadow: "none",
  borderRadius: "12px",
  p: 4,
  width: "full",
  height: "full",
};

const IconBox: FC<{ icon: React.ReactElement; color: string }> = ({ icon, color }) => (
  <Box
    p={2}
    borderRadius="8px"
    bg={`${color}.100`}
    _dark={{ bg: `${color}.900`, opacity: 0.8 }}
    color={`${color}.600`}
    _dark_color={`${color}.300`}
  >
    {icon}
  </Box>
);

const CircularGauge: FC<{ value: number; size?: number; color: string }> = ({
  value,
  size = 80,
  color,
}) => {
  const r = (size - 12) / 2;
  const circ = 2 * Math.PI * r;
  const clampedValue = Math.min(100, Math.max(0, value));
  const offset = circ - (clampedValue / 100) * circ;
  const colorMap: Record<string, string> = {
    blue: "#4d7de7",
    green: "#38a169",
    orange: "#dd6b20",
    red: "#e53e3e",
    purple: "#805ad5",
  };
  const gaugeColor =
    clampedValue > 85 ? colorMap.red :
    clampedValue > 65 ? colorMap.orange :
    colorMap[color] || colorMap.blue;

  return (
    <Box position="relative" w={`${size}px`} h={`${size}px`}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="#e2e8f0"
          strokeWidth={8}
          opacity={0.3}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={gaugeColor}
          strokeWidth={8}
          strokeDasharray={circ}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: "stroke-dashoffset 0.6s ease, stroke 0.3s ease" }}
        />
      </svg>
      <Box
        position="absolute"
        inset={0}
        display="flex"
        alignItems="center"
        justifyContent="center"
        flexDirection="column"
      >
        <Text fontWeight="bold" fontSize="lg" lineHeight="1">
          {Math.round(clampedValue)}
          <Text as="span" fontSize="xs" fontWeight="normal">%</Text>
        </Text>
      </Box>
    </Box>
  );
};

export const StatisticsQueryKey = "statistics-query-key";

export const Statistics: FC<BoxProps> = (props) => {
  const { version } = useDashboard();
  const { data: sys } = useQuery<SystemData>({
    queryKey: StatisticsQueryKey,
    queryFn: () => fetch("/system"),
    refetchInterval: 5000,
    onSuccess: ({ version: v }) => {
      if (version !== v) useDashboard.setState({ version: v });
    },
  });

  const ramPct = sys ? Math.round((sys.mem_used / sys.mem_total) * 100) : 0;
  const ramColor = ramPct > 85 ? "red" : ramPct > 65 ? "orange" : "blue";

  return (
    <Grid
      templateColumns={{ base: "1fr", sm: "repeat(2, 1fr)", lg: "repeat(3, 1fr)" }}
      gap={3}
      {...props}
    >
      {/* Active Users */}
      <GridItem>
        <Card {...cardStyle}>
          <VStack align="stretch" spacing={3} h="full">
            <HStack justify="space-between">
              <HStack spacing={2}>
                <IconBox icon={<UserIcon />} color="blue" />
                <VStack spacing={0} align="start">
                  <Text fontSize="xs" color="gray.500" _dark={{ color: "gray.400" }}>Active Users</Text>
                  <Text fontWeight="bold" fontSize="xl">
                    {sys ? numberWithCommas(sys.users_active) : "—"}
                    <Text as="span" fontWeight="normal" fontSize="sm" color="gray.400"> / {sys ? numberWithCommas(sys.total_user) : "—"}</Text>
                  </Text>
                </VStack>
              </HStack>
              {sys && (
                <Box>
                  <CircularGauge
                    value={(sys.users_active / Math.max(sys.total_user, 1)) * 100}
                    size={72}
                    color="blue"
                  />
                </Box>
              )}
            </HStack>
            {sys && (
              <Box>
                <HStack justify="space-between" mb={1}>
                  <Text fontSize="xs" color="gray.500">Doluluk</Text>
                  <Text fontSize="xs" fontWeight="semibold">
                    {Math.round((sys.users_active / Math.max(sys.total_user, 1)) * 100)}%
                  </Text>
                </HStack>
                <Progress
                  value={(sys.users_active / Math.max(sys.total_user, 1)) * 100}
                  size="sm"
                  colorScheme="blue"
                  borderRadius="full"
                  bg="gray.100"
                  _dark={{ bg: "gray.600" }}
                />
              </Box>
            )}
          </VStack>
        </Card>
      </GridItem>

      {/* CPU */}
      <GridItem>
        <Card {...cardStyle}>
          <VStack align="stretch" spacing={3} h="full">
            <HStack justify="space-between">
              <HStack spacing={2}>
                <IconBox icon={<CpuIcon />} color="purple" />
                <VStack spacing={0} align="start">
                  <Text fontSize="xs" color="gray.500" _dark={{ color: "gray.400" }}>CPU Usage</Text>
                  <Text fontWeight="bold" fontSize="xl">
                    {sys ? `${sys.cpu_usage.toFixed(1)}%` : "—"}
                  </Text>
                  {sys && (
                    <Badge colorScheme="purple" fontSize="xs" variant="subtle">
                      {sys.cpu_cores} Cores
                    </Badge>
                  )}
                </VStack>
              </HStack>
              {sys && (
                <CircularGauge value={sys.cpu_usage} size={72} color="purple" />
              )}
            </HStack>
            {sys && (
              <Box>
                <HStack justify="space-between" mb={1}>
                  <Text fontSize="xs" color="gray.500">Kullanım</Text>
                  <Text fontSize="xs" fontWeight="semibold">{sys.cpu_usage.toFixed(1)}%</Text>
                </HStack>
                <Progress
                  value={sys.cpu_usage}
                  size="sm"
                  colorScheme={sys.cpu_usage > 85 ? "red" : sys.cpu_usage > 65 ? "orange" : "purple"}
                  borderRadius="full"
                  bg="gray.100"
                  _dark={{ bg: "gray.600" }}
                />
              </Box>
            )}
          </VStack>
        </Card>
      </GridItem>

      {/* RAM */}
      <GridItem>
        <Card {...cardStyle}>
          <VStack align="stretch" spacing={3} h="full">
            <HStack justify="space-between">
              <HStack spacing={2}>
                <IconBox icon={<RamIcon />} color="green" />
                <VStack spacing={0} align="start">
                  <Text fontSize="xs" color="gray.500" _dark={{ color: "gray.400" }}>Memory (RAM)</Text>
                  <Text fontWeight="bold" fontSize="xl">
                    {sys ? formatBytes(sys.mem_used, 1) : "—"}
                  </Text>
                  <Text fontSize="xs" color="gray.500">
                    / {sys ? formatBytes(sys.mem_total, 1) : "—"}
                  </Text>
                </VStack>
              </HStack>
              {sys && (
                <CircularGauge value={ramPct} size={72} color={ramColor} />
              )}
            </HStack>
            {sys && (
              <Box>
                <HStack justify="space-between" mb={1}>
                  <Text fontSize="xs" color="gray.500">Kullanılan RAM</Text>
                  <Text fontSize="xs" fontWeight="semibold">{ramPct}%</Text>
                </HStack>
                <Progress
                  value={ramPct}
                  size="sm"
                  colorScheme={ramColor}
                  borderRadius="full"
                  bg="gray.100"
                  _dark={{ bg: "gray.600" }}
                />
              </Box>
            )}
          </VStack>
        </Card>
      </GridItem>

      {/* Upload Speed */}
      <GridItem>
        <Card {...cardStyle}>
          <VStack align="stretch" spacing={2} h="full">
            <HStack spacing={2}>
              <IconBox icon={<NetIcon />} color="orange" />
              <Text fontSize="xs" color="gray.500" _dark={{ color: "gray.400" }}>Ağ Hızı (Anlık)</Text>
            </HStack>
            <HStack spacing={4} justify="space-around" flex={1}>
              <VStack spacing={0}>
                <HStack spacing={1}>
                  <Box color="green.400"><UpIcon /></Box>
                  <Text fontSize="xs" color="gray.400">Upload</Text>
                </HStack>
                <Text fontWeight="bold" fontSize="lg" color="green.400">
                  {sys ? formatBytes(sys.outgoing_bandwidth_speed) + "/s" : "—"}
                </Text>
              </VStack>
              <Box h="40px" w="1px" bg="gray.200" _dark={{ bg: "gray.600" }} />
              <VStack spacing={0}>
                <HStack spacing={1}>
                  <Box color="blue.400"><DownIcon /></Box>
                  <Text fontSize="xs" color="gray.400">Download</Text>
                </HStack>
                <Text fontWeight="bold" fontSize="lg" color="blue.400">
                  {sys ? formatBytes(sys.incoming_bandwidth_speed) + "/s" : "—"}
                </Text>
              </VStack>
            </HStack>
          </VStack>
        </Card>
      </GridItem>

      {/* Total Traffic */}
      <GridItem>
        <Card {...cardStyle}>
          <VStack align="stretch" spacing={2} h="full">
            <HStack spacing={2}>
              <IconBox icon={<NetIcon />} color="blue" />
              <Text fontSize="xs" color="gray.500" _dark={{ color: "gray.400" }}>Toplam Trafik</Text>
            </HStack>
            <HStack spacing={4} justify="space-around" flex={1}>
              <VStack spacing={0}>
                <HStack spacing={1}>
                  <Box color="green.400"><UpIcon /></Box>
                  <Text fontSize="xs" color="gray.400">Gönderilen</Text>
                </HStack>
                <Text fontWeight="bold" fontSize="lg">
                  {sys ? formatBytes(sys.outgoing_bandwidth) : "—"}
                </Text>
              </VStack>
              <Box h="40px" w="1px" bg="gray.200" _dark={{ bg: "gray.600" }} />
              <VStack spacing={0}>
                <HStack spacing={1}>
                  <Box color="blue.400"><DownIcon /></Box>
                  <Text fontSize="xs" color="gray.400">Alınan</Text>
                </HStack>
                <Text fontWeight="bold" fontSize="lg">
                  {sys ? formatBytes(sys.incoming_bandwidth) : "—"}
                </Text>
              </VStack>
            </HStack>
          </VStack>
        </Card>
      </GridItem>

      {/* System Info */}
      <GridItem>
        <Card {...cardStyle}>
          <VStack align="stretch" spacing={2} h="full">
            <Text fontSize="xs" color="gray.500" _dark={{ color: "gray.400" }} fontWeight="semibold">
              Sistem Bilgileri
            </Text>
            <VStack align="stretch" spacing={1} flex={1} justify="center">
              <HStack justify="space-between">
                <Text fontSize="xs" color="gray.500">Xray Versiyonu</Text>
                <Badge colorScheme="blue" fontSize="xs">{sys?.version || "—"}</Badge>
              </HStack>
              <HStack justify="space-between">
                <Text fontSize="xs" color="gray.500">CPU Çekirdek</Text>
                <Text fontSize="xs" fontWeight="semibold">{sys?.cpu_cores || "—"} Core</Text>
              </HStack>
              <HStack justify="space-between">
                <Text fontSize="xs" color="gray.500">Toplam RAM</Text>
                <Text fontSize="xs" fontWeight="semibold">{sys ? formatBytes(sys.mem_total, 1) : "—"}</Text>
              </HStack>
              <HStack justify="space-between">
                <Text fontSize="xs" color="gray.500">Toplam Kullanıcı</Text>
                <Text fontSize="xs" fontWeight="semibold">{sys ? numberWithCommas(sys.total_user) : "—"}</Text>
              </HStack>
              <HStack justify="space-between">
                <Text fontSize="xs" color="gray.500">Toplam Bant Genişliği</Text>
                <Tooltip label={`↑ ${sys ? formatBytes(sys.outgoing_bandwidth) : "—"} | ↓ ${sys ? formatBytes(sys.incoming_bandwidth) : "—"}`}>
                  <Text fontSize="xs" fontWeight="semibold" cursor="help">
                    {sys ? formatBytes(sys.incoming_bandwidth + sys.outgoing_bandwidth) : "—"}
                  </Text>
                </Tooltip>
              </HStack>
            </VStack>
          </VStack>
        </Card>
      </GridItem>
    </Grid>
  );
};
