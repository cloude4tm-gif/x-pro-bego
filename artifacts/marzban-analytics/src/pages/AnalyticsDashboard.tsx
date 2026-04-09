import {
  Badge,
  Box,
  Button,
  Flex,
  Grid,
  HStack,
  Heading,
  Select,
  Stat,
  StatHelpText,
  StatLabel,
  StatNumber,
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
  ArrowTrendingUpIcon,
  ChartBarIcon,
  ChartPieIcon,
  CircleStackIcon,
  ClockIcon,
} from "@heroicons/react/24/outline";
import { chakra } from "@chakra-ui/react";
import { FC, useState } from "react";
import ReactApexChart from "react-apexcharts";
import { Header } from "components/Header";
import { ApexOptions } from "apexcharts";

const DlIcon = chakra(ArrowDownTrayIcon, { baseStyle: { w: 4, h: 4 } });

function generateDailyTraffic() {
  const labels: string[] = [];
  const upload: number[] = [];
  const download: number[] = [];
  const now = new Date();
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    labels.push(d.toLocaleDateString("tr-TR", { month: "short", day: "numeric" }));
    upload.push(parseFloat((Math.random() * 20 + 5).toFixed(2)));
    download.push(parseFloat((Math.random() * 40 + 10).toFixed(2)));
  }
  return { labels, upload, download };
}

function generateUserGrowth() {
  const months = ["Oca", "Şub", "Mar", "Nis", "May", "Haz", "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara"];
  const added = [12, 18, 15, 22, 30, 28, 35, 42, 38, 45, 50, 55];
  const removed = [3, 5, 4, 6, 8, 7, 9, 10, 8, 12, 11, 13];
  return { months, added, removed };
}

const nodeData = [
  { name: "Node-TR-1", users: 85, trafficGB: 320, uptime: 99.8 },
  { name: "Node-DE-1", users: 42, trafficGB: 180, uptime: 99.2 },
  { name: "Node-NL-1", users: 67, trafficGB: 250, uptime: 100 },
  { name: "Node-US-1", users: 23, trafficGB: 95, uptime: 98.5 },
  { name: "Node-SG-1", users: 31, trafficGB: 140, uptime: 99.6 },
];

const topUsers = [
  { username: "ali_vip", usedGB: 48.3, limit: 50, daysLeft: 12, predicted: 2 },
  { username: "mehmet_pro", usedGB: 32.1, limit: 100, daysLeft: 25, predicted: 58 },
  { username: "ayse_basic", usedGB: 8.9, limit: 10, daysLeft: 5, predicted: 1 },
  { username: "can_gold", usedGB: 75.6, limit: 200, daysLeft: 18, predicted: 42 },
  { username: "zeynep_vip", usedGB: 12.4, limit: 30, daysLeft: 8, predicted: 15 },
];

const { labels, upload, download } = generateDailyTraffic();
const { months, added, removed } = generateUserGrowth();

export const AnalyticsDashboard: FC = () => {
  const [period, setPeriod] = useState("30");

  const trafficChartOptions: ApexOptions = {
    chart: { type: "line", toolbar: { show: false }, background: "transparent" },
    theme: { mode: "dark" },
    colors: ["#48BB78", "#63B3ED"],
    stroke: { curve: "smooth", width: 2 },
    xaxis: { categories: labels, labels: { rotate: -45, style: { fontSize: "10px" } } },
    yaxis: { title: { text: "GB" } },
    legend: { position: "top" },
    grid: { borderColor: "#2D3748" },
    tooltip: { theme: "dark" },
  };

  const trafficChartSeries = [
    { name: "Upload (GB)", data: upload },
    { name: "Download (GB)", data: download },
  ];

  const growthChartOptions: ApexOptions = {
    chart: { type: "bar", toolbar: { show: false }, background: "transparent" },
    theme: { mode: "dark" },
    colors: ["#805AD5", "#FC8181"],
    xaxis: { categories: months },
    legend: { position: "top" },
    grid: { borderColor: "#2D3748" },
    tooltip: { theme: "dark" },
    plotOptions: { bar: { borderRadius: 4, columnWidth: "60%" } },
  };

  const growthChartSeries = [
    { name: "Eklenen", data: added },
    { name: "Çıkan", data: removed },
  ];

  const nodeChartOptions: ApexOptions = {
    chart: { type: "bar", horizontal: true, toolbar: { show: false }, background: "transparent" },
    theme: { mode: "dark" },
    colors: ["#4299E1"],
    xaxis: { title: { text: "Trafik (GB)" } },
    yaxis: { categories: nodeData.map((n) => n.name) },
    grid: { borderColor: "#2D3748" },
    tooltip: { theme: "dark" },
    plotOptions: { bar: { borderRadius: 4, horizontal: true } },
  };

  const nodeChartSeries = [{ name: "Trafik (GB)", data: nodeData.map((n) => n.trafficGB) }];

  const handleExportCSV = () => {
    const header = "Kullanıcı,Kullanılan (GB),Limit (GB),Kalan Gün,Tahmini Kalan Gün\n";
    const rows = topUsers.map((u) => `${u.username},${u.usedGB},${u.limit},${u.daysLeft},${u.predicted}`).join("\n");
    const blob = new Blob([header + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "xprobego_analytics.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <VStack w="full" minH="100vh" bg="gray.900" spacing={0}>
      <Box w="full" px={6} py={3} borderBottom="1px solid" borderColor="gray.700">
        <Header />
      </Box>
      <Box w="full" maxW="1400px" mx="auto" px={6} py={6}>
        <HStack justify="space-between" mb={6} flexWrap="wrap" gap={3}>
          <HStack>
            <ChartPieIcon style={{ width: 24, height: 24, color: "#805AD5" }} />
            <Heading size="md" color="white">Analitik & Raporlar</Heading>
          </HStack>
          <HStack>
            <Select
              size="sm"
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              bg="gray.800"
              borderColor="gray.600"
              color="white"
              w="150px"
            >
              <option value="7">Son 7 Gün</option>
              <option value="30">Son 30 Gün</option>
              <option value="90">Son 90 Gün</option>
            </Select>
            <Button size="sm" leftIcon={<DlIcon />} colorScheme="green" onClick={handleExportCSV}>
              CSV İndir
            </Button>
          </HStack>
        </HStack>

        <Grid templateColumns={{ base: "1fr", md: "repeat(4, 1fr)" }} gap={4} mb={6}>
          {[
            { label: "Toplam Trafik (Ay)", value: "1.24 TB", sub: "+18% geçen aya göre", color: "blue.400", Icon: CircleStackIcon },
            { label: "Aktif Kullanıcı", value: "248", sub: "Bu ay eklenen: +55", color: "green.400", Icon: ArrowTrendingUpIcon },
            { label: "Ort. Kullanım", value: "32 GB", sub: "Kullanıcı başına", color: "purple.400", Icon: ChartBarIcon },
            { label: "Ortalama Süre", value: "27 Gün", sub: "Abonelik süresi", color: "orange.400", Icon: ClockIcon },
          ].map(({ label, value, sub, color, Icon }) => (
            <Box key={label} bg="gray.800" borderRadius="xl" p={4} border="1px solid" borderColor="gray.700">
              <HStack mb={2}>
                <Icon style={{ width: 20, height: 20, color: "inherit" }} />
                <Text fontSize="xs" color="gray.400">{label}</Text>
              </HStack>
              <Stat>
                <StatNumber color={color} fontSize="2xl">{value}</StatNumber>
                <StatHelpText color="gray.500" fontSize="xs">{sub}</StatHelpText>
              </Stat>
            </Box>
          ))}
        </Grid>

        <Grid templateColumns={{ base: "1fr", lg: "2fr 1fr" }} gap={6} mb={6}>
          <Box bg="gray.800" borderRadius="xl" p={5} border="1px solid" borderColor="gray.700">
            <Text fontWeight="bold" color="white" mb={4}>Günlük Trafik (GB)</Text>
            <ReactApexChart options={trafficChartOptions} series={trafficChartSeries} type="line" height={220} />
          </Box>
          <Box bg="gray.800" borderRadius="xl" p={5} border="1px solid" borderColor="gray.700">
            <Text fontWeight="bold" color="white" mb={4}>Node Trafik Dağılımı</Text>
            <ReactApexChart options={nodeChartOptions} series={nodeChartSeries} type="bar" height={220} />
          </Box>
        </Grid>

        <Grid templateColumns={{ base: "1fr", lg: "1fr 1fr" }} gap={6} mb={6}>
          <Box bg="gray.800" borderRadius="xl" p={5} border="1px solid" borderColor="gray.700">
            <Text fontWeight="bold" color="white" mb={4}>Aylık Kullanıcı Büyüme Raporu</Text>
            <ReactApexChart options={growthChartOptions} series={growthChartSeries} type="bar" height={220} />
          </Box>
          <Box bg="gray.800" borderRadius="xl" p={5} border="1px solid" borderColor="gray.700">
            <HStack justify="space-between" mb={4}>
              <Text fontWeight="bold" color="white">Node Performansı</Text>
              <Badge colorScheme="purple">{nodeData.length} Node</Badge>
            </HStack>
            <Table size="sm" variant="unstyled">
              <Thead>
                <Tr>
                  <Th color="gray.500" fontSize="xs">Node</Th>
                  <Th color="gray.500" fontSize="xs" isNumeric>Kullanıcı</Th>
                  <Th color="gray.500" fontSize="xs" isNumeric>Trafik</Th>
                  <Th color="gray.500" fontSize="xs" isNumeric>Uptime</Th>
                </Tr>
              </Thead>
              <Tbody>
                {nodeData.map((n) => (
                  <Tr key={n.name} borderTop="1px solid" borderColor="gray.700">
                    <Td color="white" fontSize="sm">{n.name}</Td>
                    <Td isNumeric color="blue.300" fontSize="sm">{n.users}</Td>
                    <Td isNumeric color="green.300" fontSize="sm">{n.trafficGB} GB</Td>
                    <Td isNumeric fontSize="sm">
                      <Badge colorScheme={n.uptime === 100 ? "green" : n.uptime > 99 ? "blue" : "yellow"}>
                        {n.uptime}%
                      </Badge>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </Box>
        </Grid>

        <Box bg="gray.800" borderRadius="xl" p={5} border="1px solid" borderColor="gray.700">
          <HStack justify="space-between" mb={4}>
            <Text fontWeight="bold" color="white">Bant Genişliği Tahmini — Kritik Kullanıcılar</Text>
            <Button size="xs" leftIcon={<DlIcon />} variant="outline" colorScheme="green" onClick={handleExportCSV}>
              CSV
            </Button>
          </HStack>
          <Table size="sm" variant="unstyled">
            <Thead>
              <Tr>
                <Th color="gray.500" fontSize="xs">Kullanıcı</Th>
                <Th color="gray.500" fontSize="xs" isNumeric>Kullanılan</Th>
                <Th color="gray.500" fontSize="xs" isNumeric>Limit</Th>
                <Th color="gray.500" fontSize="xs" isNumeric>Kalan Gün</Th>
                <Th color="gray.500" fontSize="xs">Tahmini Biter</Th>
                <Th color="gray.500" fontSize="xs">Risk</Th>
              </Tr>
            </Thead>
            <Tbody>
              {topUsers.map((u) => {
                const pct = (u.usedGB / u.limit) * 100;
                const risk = u.predicted <= 3 ? "Kritik" : u.predicted <= 10 ? "Yüksek" : "Normal";
                const riskColor = risk === "Kritik" ? "red" : risk === "Yüksek" ? "orange" : "green";
                return (
                  <Tr key={u.username} borderTop="1px solid" borderColor="gray.700">
                    <Td color="white" fontSize="sm" fontWeight="medium">{u.username}</Td>
                    <Td isNumeric color="gray.300" fontSize="sm">{u.usedGB} GB</Td>
                    <Td isNumeric color="gray.300" fontSize="sm">{u.limit} GB</Td>
                    <Td isNumeric fontSize="sm">
                      <Badge colorScheme={u.daysLeft <= 5 ? "red" : u.daysLeft <= 14 ? "orange" : "green"}>
                        {u.daysLeft} gün
                      </Badge>
                    </Td>
                    <Td color="gray.300" fontSize="sm">{u.predicted} gün içinde</Td>
                    <Td fontSize="sm">
                      <Badge colorScheme={riskColor}>{risk}</Badge>
                    </Td>
                  </Tr>
                );
              })}
            </Tbody>
          </Table>
        </Box>
      </Box>
    </VStack>
  );
};
