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
  Progress,
  Select,
  Switch,
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
  ArrowDownTrayIcon,
  ArrowPathIcon,
  CircleStackIcon,
  CloudArrowUpIcon,
  PlusIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import { chakra } from "@chakra-ui/react";
import { FC, useState } from "react";
import { Header } from "components/Header";

const DlIcon = chakra(ArrowDownTrayIcon, { baseStyle: { w: 4, h: 4 } });
const DeleteIcon = chakra(TrashIcon, { baseStyle: { w: 4, h: 4 } });
const RestoreIcon = chakra(ArrowPathIcon, { baseStyle: { w: 4, h: 4 } });
const UploadIcon = chakra(CloudArrowUpIcon, { baseStyle: { w: 4, h: 4 } });

interface Backup {
  id: number;
  name: string;
  type: "manual" | "auto" | "scheduled";
  sizeKB: number;
  createdAt: string;
  includes: string[];
  status: "ready" | "corrupted";
}

const initialBackups: Backup[] = [
  { id: 1, name: "backup_2026-04-09_14-00", type: "scheduled", sizeKB: 842, createdAt: "2026-04-09 14:00:00", includes: ["users", "admins", "settings"], status: "ready" },
  { id: 2, name: "backup_2026-04-08_14-00", type: "scheduled", sizeKB: 810, createdAt: "2026-04-08 14:00:00", includes: ["users", "admins", "settings"], status: "ready" },
  { id: 3, name: "manual_node_update", type: "manual", sizeKB: 788, createdAt: "2026-04-07 09:22:15", includes: ["users", "nodes", "hosts"], status: "ready" },
  { id: 4, name: "backup_2026-04-07_14-00", type: "scheduled", sizeKB: 795, createdAt: "2026-04-07 14:00:00", includes: ["users", "admins", "settings"], status: "ready" },
  { id: 5, name: "backup_2026-04-05_14-00", type: "scheduled", sizeKB: 652, createdAt: "2026-04-05 14:00:00", includes: ["users", "admins"], status: "corrupted" },
];

const scheduleOptions = [
  { value: "daily", label: "Her gün" },
  { value: "12h", label: "Her 12 saat" },
  { value: "6h", label: "Her 6 saat" },
  { value: "weekly", label: "Haftalık" },
  { value: "manual", label: "Sadece manual" },
];

export const BackupManager: FC = () => {
  const [backups, setBackups] = useState<Backup[]>(initialBackups);
  const [creating, setCreating] = useState(false);
  const [createProgress, setCreateProgress] = useState(0);
  const [autoEnabled, setAutoEnabled] = useState(true);
  const [schedule, setSchedule] = useState("daily");
  const [retentionDays, setRetentionDays] = useState("7");
  const [backupPath, setBackupPath] = useState("/opt/marzban/backups");
  const { isOpen: isRestoreOpen, onOpen: onRestoreOpen, onClose: onRestoreClose } = useDisclosure();
  const [restoreTarget, setRestoreTarget] = useState<Backup | null>(null);
  const toast = useToast();

  const totalSizeKB = backups.reduce((s, b) => s + b.sizeKB, 0);

  const handleCreate = () => {
    setCreating(true);
    setCreateProgress(0);
    const interval = setInterval(() => {
      setCreateProgress((p) => {
        if (p >= 100) {
          clearInterval(interval);
          const now = new Date().toISOString().replace("T", " ").slice(0, 19);
          const name = `manual_${now.replace(/[: ]/g, "-")}`;
          setBackups((prev) => [{
            id: Date.now(), name, type: "manual", sizeKB: Math.floor(Math.random() * 100 + 800),
            createdAt: now, includes: ["users", "admins", "settings", "nodes"], status: "ready",
          }, ...prev]);
          setCreating(false);
          toast({ title: "Yedek oluşturuldu", status: "success", duration: 3000 });
          return 0;
        }
        return p + 10;
      });
    }, 180);
  };

  const handleDelete = (id: number) => {
    setBackups((prev) => prev.filter((b) => b.id !== id));
    toast({ title: "Yedek silindi", status: "info", duration: 2000 });
  };

  const handleRestore = () => {
    toast({ title: `${restoreTarget?.name} geri yükleniyor...`, description: "Sistem 30 saniye içinde yeniden başlayacak", status: "warning", duration: 5000 });
    onRestoreClose();
  };

  const downloadBackup = (b: Backup) => {
    const content = JSON.stringify({ name: b.name, includes: b.includes, createdAt: b.createdAt, note: "X-Pro Bego Yedek Dosyası" }, null, 2);
    const blob = new Blob([content], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${b.name}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <VStack w="full" minH="100vh" bg="gray.900" spacing={0}>
      <Box w="full" px={6} py={3} borderBottom="1px solid" borderColor="gray.700">
        <Header />
      </Box>
      <Box w="full" maxW="1100px" mx="auto" px={6} py={6}>
        <HStack justify="space-between" mb={6} flexWrap="wrap" gap={3}>
          <HStack>
            <CircleStackIcon style={{ width: 24, height: 24, color: "#68D391" }} />
            <Heading size="md" color="white">Yedekleme Sistemi</Heading>
          </HStack>
          <Button size="sm" leftIcon={<UploadIcon />} colorScheme="green" onClick={handleCreate} isLoading={creating} loadingText="Yedekleniyor...">
            Manuel Yedek Al
          </Button>
        </HStack>

        {creating && (
          <Box bg="gray.800" borderRadius="xl" p={4} mb={5} border="1px solid" borderColor="green.600">
            <Text color="green.400" fontSize="sm" mb={2}>Yedek oluşturuluyor... {createProgress}%</Text>
            <Progress value={createProgress} colorScheme="green" borderRadius="full" size="sm" />
          </Box>
        )}

        <HStack mb={6} spacing={4} flexWrap="wrap">
          {[
            { label: "Toplam Yedek", value: backups.length, color: "blue.400" },
            { label: "Toplam Boyut", value: `${(totalSizeKB / 1024).toFixed(1)} MB`, color: "green.400" },
            { label: "Son Yedek", value: backups[0]?.createdAt.split(" ")[0] || "—", color: "purple.400" },
            { label: "Bozuk Yedek", value: backups.filter((b) => b.status === "corrupted").length, color: "red.400" },
          ].map(({ label, value, color }) => (
            <Box key={label} bg="gray.800" borderRadius="xl" p={4} border="1px solid" borderColor="gray.700" flex={1} minW="130px">
              <Text fontSize="xs" color="gray.400">{label}</Text>
              <Text fontSize="lg" fontWeight="bold" color={color}>{value}</Text>
            </Box>
          ))}
        </HStack>

        <Box bg="gray.800" borderRadius="xl" p={5} mb={6} border="1px solid" borderColor="gray.700">
          <Text fontWeight="bold" color="white" mb={4}>⚙️ Otomatik Yedekleme Ayarları</Text>
          <HStack flexWrap="wrap" spacing={6}>
            <HStack>
              <Switch isChecked={autoEnabled} onChange={(e) => setAutoEnabled(e.target.checked)} colorScheme="green" />
              <Text color="gray.300" fontSize="sm">Otomatik Yedekleme</Text>
            </HStack>
            <FormControl w="auto">
              <FormLabel color="gray.400" fontSize="xs">Sıklık</FormLabel>
              <Select size="sm" bg="gray.700" borderColor="gray.600" color="white" value={schedule} onChange={(e) => setSchedule(e.target.value)} isDisabled={!autoEnabled}>
                {scheduleOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </Select>
            </FormControl>
            <FormControl w="auto">
              <FormLabel color="gray.400" fontSize="xs">Saklama Süresi (gün)</FormLabel>
              <Input size="sm" type="number" bg="gray.700" borderColor="gray.600" color="white" value={retentionDays} onChange={(e) => setRetentionDays(e.target.value)} w="100px" isDisabled={!autoEnabled} />
            </FormControl>
            <FormControl flex={1} minW="200px">
              <FormLabel color="gray.400" fontSize="xs">Yedek Dizini</FormLabel>
              <Input size="sm" bg="gray.700" borderColor="gray.600" color="white" fontFamily="mono" value={backupPath} onChange={(e) => setBackupPath(e.target.value)} isDisabled={!autoEnabled} />
            </FormControl>
          </HStack>
        </Box>

        <Box bg="gray.800" borderRadius="xl" border="1px solid" borderColor="gray.700" overflow="hidden">
          <Table size="sm" variant="unstyled">
            <Thead>
              <Tr bg="gray.750">
                <Th color="gray.400" fontSize="xs" py={4} pl={4}>Yedek Adı</Th>
                <Th color="gray.400" fontSize="xs">Tür</Th>
                <Th color="gray.400" fontSize="xs">Boyut</Th>
                <Th color="gray.400" fontSize="xs">İçerik</Th>
                <Th color="gray.400" fontSize="xs">Tarih</Th>
                <Th color="gray.400" fontSize="xs">Durum</Th>
                <Th color="gray.400" fontSize="xs">İşlem</Th>
              </Tr>
            </Thead>
            <Tbody>
              {backups.map((b) => (
                <Tr key={b.id} borderTop="1px solid" borderColor="gray.700" _hover={{ bg: "gray.750" }}>
                  <Td pl={4} py={3}>
                    <Text fontFamily="mono" fontSize="xs" color="white">{b.name}</Text>
                  </Td>
                  <Td>
                    <Badge colorScheme={b.type === "manual" ? "purple" : b.type === "scheduled" ? "blue" : "cyan"} fontSize="xs">
                      {b.type === "manual" ? "Manuel" : b.type === "scheduled" ? "Zamanlanmış" : "Otomatik"}
                    </Badge>
                  </Td>
                  <Td>
                    <Text color="gray.300" fontSize="sm">{(b.sizeKB / 1024).toFixed(2)} MB</Text>
                  </Td>
                  <Td>
                    <HStack flexWrap="wrap" spacing={1}>
                      {b.includes.map((inc) => <Badge key={inc} colorScheme="gray" fontSize="2xs">{inc}</Badge>)}
                    </HStack>
                  </Td>
                  <Td>
                    <Text fontSize="xs" color="gray.400">{b.createdAt}</Text>
                  </Td>
                  <Td>
                    <Badge colorScheme={b.status === "ready" ? "green" : "red"}>
                      {b.status === "ready" ? "Hazır" : "Bozuk"}
                    </Badge>
                  </Td>
                  <Td>
                    <HStack spacing={1}>
                      <Tooltip label="İndir">
                        <IconButton size="xs" icon={<DlIcon />} aria-label="İndir" variant="ghost" colorScheme="green" onClick={() => downloadBackup(b)} />
                      </Tooltip>
                      <Tooltip label="Geri Yükle">
                        <IconButton size="xs" icon={<RestoreIcon />} aria-label="Geri yükle" variant="ghost" colorScheme="orange" isDisabled={b.status === "corrupted"} onClick={() => { setRestoreTarget(b); onRestoreOpen(); }} />
                      </Tooltip>
                      <IconButton size="xs" icon={<DeleteIcon />} aria-label="Sil" variant="ghost" colorScheme="red" onClick={() => handleDelete(b.id)} />
                    </HStack>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </Box>
      </Box>

      <Modal isOpen={isRestoreOpen} onClose={onRestoreClose} size="sm">
        <ModalOverlay backdropFilter="blur(6px)" />
        <ModalContent bg="gray.800" border="1px solid" borderColor="orange.500">
          <ModalHeader color="orange.400">⚠️ Geri Yükleme Onayı</ModalHeader>
          <ModalCloseButton color="gray.400" />
          <ModalBody>
            <Text color="gray.300" fontSize="sm">
              <strong>{restoreTarget?.name}</strong> yedeği geri yüklenecek. Mevcut tüm veriler bu yedeğin içeriğiyle <strong>DEĞİŞTİRİLECEK</strong>. Bu işlem geri alınamaz.
            </Text>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" color="gray.400" mr={3} onClick={onRestoreClose}>İptal</Button>
            <Button colorScheme="orange" onClick={handleRestore}>Geri Yükle</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </VStack>
  );
};
