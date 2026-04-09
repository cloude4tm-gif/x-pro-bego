import {
  Badge,
  Box,
  Button,
  Checkbox,
  CheckboxGroup,
  FormControl,
  FormHelperText,
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
  SimpleGrid,
  Spinner,
  Stack,
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
  AlertDialog,
  AlertDialogBody,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogOverlay,
} from "@chakra-ui/react";
import { PlusIcon, TrashIcon, EyeIcon, KeyIcon } from "@heroicons/react/24/outline";
import { chakra } from "@chakra-ui/react";
import { FC, useEffect, useRef, useState } from "react";
import { Header } from "components/Header";
import { xpbApi } from "service/xpbApi";

const AddIcon = chakra(PlusIcon, { baseStyle: { w: 4, h: 4 } });
const DeleteIcon = chakra(TrashIcon, { baseStyle: { w: 4, h: 4 } });
const ShowIcon = chakra(EyeIcon, { baseStyle: { w: 4, h: 4 } });
const KeyIconC = chakra(KeyIcon, { baseStyle: { w: 5, h: 5 } });

const ALL_PERMISSIONS = ["users:read", "users:write", "stats:read", "nodes:read", "nodes:write", "inbounds:read", "admins:read"];

export const ApiKeyManager: FC = () => {
  const [keys, setKeys] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newKeyName, setNewKeyName] = useState("");
  const [selectedPerms, setSelectedPerms] = useState<string[]>([]);
  const [revealedKey, setRevealedKey] = useState<{ key: string; name: string } | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { isOpen: isRevOpen, onOpen: onRevOpen, onClose: onRevClose } = useDisclosure();
  const { isOpen: isDelOpen, onOpen: onDelOpen, onClose: onDelClose } = useDisclosure();
  const cancelRef = useRef(null);
  const toast = useToast();

  const load = async () => {
    try { const data = await xpbApi.getApiKeys(); setKeys(data); }
    catch { /* ignore */ } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async () => {
    if (!newKeyName) return;
    try {
      const res = await xpbApi.createApiKey({ name: newKeyName, permissions: selectedPerms });
      setKeys(p => [...p, res]);
      setRevealedKey({ key: res.rawKey, name: res.name });
      onClose();
      onRevOpen();
      toast({ title: "API Anahtarı oluşturuldu", status: "success", duration: 3000 });
      setNewKeyName("");
      setSelectedPerms([]);
    } catch (err: any) { toast({ title: "Hata", description: err.message, status: "error", duration: 3000 }); }
  };

  const handleRevoke = async (id: number) => {
    try {
      await xpbApi.revokeApiKey(id);
      setKeys(p => p.map(k => k.id === id ? { ...k, active: false } : k));
      toast({ title: "Anahtar devre dışı bırakıldı", status: "warning", duration: 2000 });
    } catch (err: any) { toast({ title: "Hata", description: err.message, status: "error", duration: 3000 }); }
  };

  const confirmDelete = (id: number) => { setDeleteTargetId(id); onDelOpen(); };
  const handleDelete = async () => {
    if (!deleteTargetId) return;
    try {
      await xpbApi.deleteApiKey(deleteTargetId);
      setKeys(p => p.filter(k => k.id !== deleteTargetId));
      toast({ title: "Anahtar silindi", status: "info", duration: 2000 });
    } catch (err: any) { toast({ title: "Hata", description: err.message, status: "error", duration: 3000 }); }
    finally { onDelClose(); setDeleteTargetId(null); }
  };

  return (
    <VStack w="full" minH="100vh" bg="gray.900" spacing={0}>
      <Box w="full" px={6} py={3} borderBottom="1px solid" borderColor="gray.700"><Header /></Box>
      <Box w="full" maxW="1200px" mx="auto" px={6} py={6}>
        <HStack justify="space-between" mb={6} flexWrap="wrap" gap={3}>
          <HStack><KeyIconC color="yellow.400" /><Heading size="md" color="white">API Anahtar Yönetimi</Heading></HStack>
          <Button size="sm" leftIcon={<AddIcon />} colorScheme="yellow" onClick={onOpen}>Yeni Anahtar</Button>
        </HStack>

        <HStack mb={6} gap={4} flexWrap="wrap">
          {[
            { label: "Toplam Anahtar", value: keys.length, color: "blue.400" },
            { label: "Aktif", value: keys.filter(k => k.active).length, color: "green.400" },
            { label: "Devre Dışı", value: keys.filter(k => !k.active).length, color: "red.400" },
          ].map(({ label, value, color }) => (
            <Box key={label} bg="gray.800" borderRadius="xl" p={4} flex={1} minW="140px" border="1px solid" borderColor="gray.700">
              <Text color="gray.400" fontSize="sm">{label}</Text>
              <Text color={color} fontSize="2xl" fontWeight="bold">{value}</Text>
            </Box>
          ))}
        </HStack>

        {loading ? (
          <HStack justify="center" py={16}><Spinner color="yellow.400" size="xl" /></HStack>
        ) : (
          <Box bg="gray.800" borderRadius="xl" overflow="hidden" border="1px solid" borderColor="gray.700">
            <Table variant="unstyled">
              <Thead bg="gray.750">
                <Tr>
                  {["Ad", "Anahtar Prefix", "İzinler", "Durum", "Son Kullanım", "Oluşturulma", "İşlemler"].map(h => (
                    <Th key={h} color="gray.400" fontSize="xs" py={3}>{h}</Th>
                  ))}
                </Tr>
              </Thead>
              <Tbody>
                {keys.length === 0 ? (
                  <Tr><Td colSpan={7} textAlign="center" py={10}><Text color="gray.500">Henüz API anahtarı yok.</Text></Td></Tr>
                ) : keys.map(k => (
                  <Tr key={k.id} borderTop="1px solid" borderColor="gray.700" _hover={{ bg: "gray.750" }} opacity={k.active ? 1 : 0.6}>
                    <Td py={3}><Text color="white" fontWeight="medium">{k.name}</Text></Td>
                    <Td><Text fontFamily="mono" color="cyan.400" fontSize="sm">{k.keyPrefix}...</Text></Td>
                    <Td>
                      <HStack flexWrap="wrap" gap={1}>
                        {(k.permissions || []).map((p: string) => <Badge key={p} colorScheme="purple" fontSize="2xs">{p}</Badge>)}
                      </HStack>
                    </Td>
                    <Td><Badge colorScheme={k.active ? "green" : "red"}>{k.active ? "Aktif" : "Pasif"}</Badge></Td>
                    <Td><Text color="gray.400" fontSize="sm">{k.lastUsed ? new Date(k.lastUsed).toLocaleDateString("tr-TR") : "—"}</Text></Td>
                    <Td><Text color="gray.400" fontSize="sm">{new Date(k.createdAt).toLocaleDateString("tr-TR")}</Text></Td>
                    <Td>
                      <HStack spacing={1}>
                        {k.active && <Button size="xs" colorScheme="orange" variant="ghost" onClick={() => handleRevoke(k.id)}>İptal Et</Button>}
                        <IconButton size="xs" icon={<DeleteIcon />} aria-label="Sil" colorScheme="red" variant="ghost" onClick={() => confirmDelete(k.id)} />
                      </HStack>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </Box>
        )}
      </Box>

      <Modal isOpen={isOpen} onClose={onClose} size="md">
        <ModalOverlay backdropFilter="blur(6px)" />
        <ModalContent bg="gray.800" border="1px solid" borderColor="gray.700">
          <ModalHeader color="white">Yeni API Anahtarı</ModalHeader>
          <ModalCloseButton color="gray.400" />
          <ModalBody>
            <VStack spacing={4}>
              <FormControl>
                <FormLabel color="gray.400" fontSize="sm">Anahtar Adı</FormLabel>
                <Input bg="gray.700" borderColor="gray.600" color="white" placeholder="Üretim Anahtarı" value={newKeyName} onChange={e => setNewKeyName(e.target.value)} />
              </FormControl>
              <FormControl>
                <FormLabel color="gray.400" fontSize="sm">İzinler</FormLabel>
                <CheckboxGroup value={selectedPerms} onChange={(v) => setSelectedPerms(v as string[])}>
                  <SimpleGrid columns={2} spacing={2}>
                    {ALL_PERMISSIONS.map(p => (
                      <Checkbox key={p} value={p} colorScheme="yellow">
                        <Text color="gray.300" fontSize="sm">{p}</Text>
                      </Checkbox>
                    ))}
                  </SimpleGrid>
                </CheckboxGroup>
                <FormHelperText color="gray.500" fontSize="xs">Hiç seçilmezse tüm izinlere sahip olur.</FormHelperText>
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" color="gray.400" mr={3} onClick={onClose}>İptal</Button>
            <Button colorScheme="yellow" onClick={handleCreate}>Oluştur</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <Modal isOpen={isRevOpen} onClose={onRevClose} size="md">
        <ModalOverlay backdropFilter="blur(6px)" />
        <ModalContent bg="gray.800" border="1px solid" borderColor="yellow.500">
          <ModalHeader color="yellow.400">⚠️ Anahtarı Kaydedin!</ModalHeader>
          <ModalCloseButton color="gray.400" />
          <ModalBody>
            <VStack spacing={4}>
              <Text color="gray.300" fontSize="sm">Bu anahtar yalnızca <strong>bir kez</strong> gösterilecek. Güvenli bir yerde saklayın!</Text>
              <Box w="full" bg="gray.900" borderRadius="lg" p={4} border="2px solid" borderColor="yellow.500">
                <HStack justify="space-between">
                  <Text fontFamily="mono" color="yellow.300" fontSize="sm" wordBreak="break-all">{revealedKey?.key}</Text>
                  <IconButton size="xs" icon={<ShowIcon />} aria-label="Kopyala" variant="ghost" colorScheme="yellow" onClick={() => { navigator.clipboard.writeText(revealedKey?.key || ""); toast({ title: "Kopyalandı", status: "success", duration: 1500 }); }} />
                </HStack>
              </Box>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button colorScheme="yellow" onClick={onRevClose}>Anladım, Kapattım</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <AlertDialog isOpen={isDelOpen} leastDestructiveRef={cancelRef} onClose={onDelClose}>
        <AlertDialogOverlay backdropFilter="blur(6px)" />
        <AlertDialogContent bg="gray.800" border="1px solid" borderColor="red.500">
          <AlertDialogHeader color="white">Anahtarı Sil</AlertDialogHeader>
          <AlertDialogBody color="gray.300">Bu işlem geri alınamaz. Emin misiniz?</AlertDialogBody>
          <AlertDialogFooter>
            <Button ref={cancelRef} variant="ghost" color="gray.400" onClick={onDelClose}>İptal</Button>
            <Button colorScheme="red" ml={3} onClick={handleDelete}>Sil</Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </VStack>
  );
};
