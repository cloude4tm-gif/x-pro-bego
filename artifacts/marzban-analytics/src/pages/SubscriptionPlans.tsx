import {
  Badge,
  Box,
  Button,
  Divider,
  FormControl,
  FormLabel,
  Grid,
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
  Spinner,
  Text,
  Textarea,
  VStack,
  useDisclosure,
  useToast,
} from "@chakra-ui/react";
import { PencilIcon, PlusIcon, SparklesIcon, TrashIcon } from "@heroicons/react/24/outline";
import { chakra } from "@chakra-ui/react";
import { FC, useEffect, useState } from "react";
import { Header } from "components/Header";
import { xpbApi } from "service/xpbApi";

const EditIcon = chakra(PencilIcon, { baseStyle: { w: 4, h: 4 } });
const DeleteIcon = chakra(TrashIcon, { baseStyle: { w: 4, h: 4 } });
const AddIcon = chakra(PlusIcon, { baseStyle: { w: 4, h: 4 } });
const StarIcon = chakra(SparklesIcon, { baseStyle: { w: 5, h: 5 } });

const emptyForm = { name: "", emoji: "⭐", color: "blue", price: 0, currency: "USD", dataLimitGB: 0, durationDays: 30, userLimit: 1, description: "", popular: false };

export const SubscriptionPlans: FC = () => {
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingPlan, setEditingPlan] = useState<any>(null);
  const [formData, setFormData] = useState<any>(emptyForm);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();

  const load = async () => {
    try {
      const data = await xpbApi.getPlans();
      setPlans(data);
    } catch { /* ignore on first load if DB empty */ }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => { setEditingPlan(null); setFormData(emptyForm); onOpen(); };
  const openEdit = (plan: any) => { setEditingPlan(plan); setFormData({ ...plan }); onOpen(); };

  const handleSave = async () => {
    if (!formData.name) return;
    try {
      if (editingPlan) {
        const updated = await xpbApi.updatePlan(editingPlan.id, formData);
        setPlans(prev => prev.map(p => p.id === editingPlan.id ? updated : p));
        toast({ title: "Plan güncellendi", status: "success", duration: 2000 });
      } else {
        const created = await xpbApi.createPlan(formData);
        setPlans(prev => [...prev, created]);
        toast({ title: "Plan oluşturuldu", status: "success", duration: 2000 });
      }
      onClose();
    } catch (err: any) {
      toast({ title: "Hata", description: err.message, status: "error", duration: 3000 });
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await xpbApi.deletePlan(id);
      setPlans(prev => prev.filter(p => p.id !== id));
      toast({ title: "Plan silindi", status: "info", duration: 2000 });
    } catch (err: any) {
      toast({ title: "Hata", description: err.message, status: "error", duration: 3000 });
    }
  };

  const totalRevenue = plans.reduce((s, p) => s + (p.price ?? 0) * (p.activeUsers ?? 0), 0);
  const totalUsers = plans.reduce((s, p) => s + (p.activeUsers ?? 0), 0);

  return (
    <VStack w="full" minH="100vh" bg="gray.900" spacing={0}>
      <Box w="full" px={6} py={3} borderBottom="1px solid" borderColor="gray.700">
        <Header />
      </Box>
      <Box w="full" maxW="1400px" mx="auto" px={6} py={6}>
        <HStack justify="space-between" mb={6} flexWrap="wrap" gap={3}>
          <HStack><StarIcon color="yellow.400" /><Heading size="md" color="white">Abonelik Planları</Heading></HStack>
          <Button size="sm" leftIcon={<AddIcon />} colorScheme="blue" onClick={openCreate}>Yeni Plan</Button>
        </HStack>

        <Grid templateColumns={{ base: "1fr", md: "repeat(3, 1fr)" }} gap={4} mb={8}>
          {[
            { label: "Toplam Aylık Gelir", value: `$${totalRevenue.toLocaleString()}`, color: "green.400" },
            { label: "Aktif Aboneler", value: totalUsers, color: "blue.400" },
            { label: "Plan Sayısı", value: plans.length, color: "purple.400" },
          ].map(({ label, value, color }) => (
            <Box key={label} bg="gray.800" borderRadius="xl" p={4} border="1px solid" borderColor="gray.700">
              <Text color="gray.400" fontSize="sm">{label}</Text>
              <Text color={color} fontSize="2xl" fontWeight="bold">{value}</Text>
            </Box>
          ))}
        </Grid>

        {loading ? (
          <HStack justify="center" py={16}><Spinner color="blue.400" size="xl" /></HStack>
        ) : plans.length === 0 ? (
          <Box textAlign="center" py={16}>
            <Text color="gray.400" mb={4}>Henüz plan yok. İlk planı oluşturun!</Text>
            <Button colorScheme="blue" leftIcon={<AddIcon />} onClick={openCreate}>İlk Planı Oluştur</Button>
          </Box>
        ) : (
          <Grid templateColumns={{ base: "1fr", md: "repeat(2, 1fr)", lg: "repeat(4, 1fr)" }} gap={5}>
            {plans.map((plan: any) => (
              <Box key={plan.id} bg="gray.800" borderRadius="2xl" border="2px solid" borderColor={plan.popular ? `${plan.color}.500` : "gray.700"} overflow="hidden" position="relative">
                {plan.popular && (
                  <Box bg={`${plan.color}.500`} textAlign="center" py={1}>
                    <Text fontSize="xs" fontWeight="bold" color="white">⭐ EN POPÜLER</Text>
                  </Box>
                )}
                <Box p={5}>
                  <Text fontSize="3xl" mb={1}>{plan.emoji}</Text>
                  <Heading size="md" color="white" mb={1}>{plan.name}</Heading>
                  <Text fontSize="xs" color="gray.400" mb={4}>{plan.description}</Text>
                  <Text fontSize="3xl" fontWeight="bold" color={`${plan.color}.400`}>
                    ${plan.price}<Text as="span" fontSize="sm" fontWeight="normal" color="gray.400"> /ay</Text>
                  </Text>
                  <Divider my={4} borderColor="gray.700" />
                  <VStack align="start" spacing={2} mb={4}>
                    <HStack><Badge colorScheme="green">Data</Badge><Text fontSize="sm" color="gray.300">{plan.dataLimitGB === 0 ? "Sınırsız" : `${plan.dataLimitGB} GB`}</Text></HStack>
                    <HStack><Badge colorScheme="blue">Süre</Badge><Text fontSize="sm" color="gray.300">{plan.durationDays} gün</Text></HStack>
                    <HStack><Badge colorScheme="purple">Cihaz</Badge><Text fontSize="sm" color="gray.300">{plan.userLimit === 0 ? "Sınırsız" : `${plan.userLimit} kullanıcı`}</Text></HStack>
                  </VStack>
                  <HStack>
                    <Button size="sm" leftIcon={<EditIcon />} variant="outline" colorScheme="blue" flex={1} onClick={() => openEdit(plan)}>Düzenle</Button>
                    <IconButton size="sm" icon={<DeleteIcon />} aria-label="Sil" colorScheme="red" variant="outline" onClick={() => handleDelete(plan.id)} />
                  </HStack>
                </Box>
              </Box>
            ))}
          </Grid>
        )}
      </Box>

      <Modal isOpen={isOpen} onClose={onClose} size="md">
        <ModalOverlay backdropFilter="blur(6px)" />
        <ModalContent bg="gray.800" borderColor="gray.700" border="1px solid">
          <ModalHeader color="white">{editingPlan ? "Plan Düzenle" : "Yeni Plan Oluştur"}</ModalHeader>
          <ModalCloseButton color="gray.400" />
          <ModalBody>
            <VStack spacing={4}>
              <HStack w="full">
                <FormControl flex="0 0 80px">
                  <FormLabel color="gray.400" fontSize="sm">Emoji</FormLabel>
                  <Input bg="gray.700" borderColor="gray.600" color="white" value={formData.emoji} onChange={e => setFormData((f: any) => ({ ...f, emoji: e.target.value }))} fontSize="xl" textAlign="center" />
                </FormControl>
                <FormControl flex={1}>
                  <FormLabel color="gray.400" fontSize="sm">Plan Adı</FormLabel>
                  <Input bg="gray.700" borderColor="gray.600" color="white" placeholder="Bronze, Silver..." value={formData.name} onChange={e => setFormData((f: any) => ({ ...f, name: e.target.value }))} />
                </FormControl>
              </HStack>
              <FormControl>
                <FormLabel color="gray.400" fontSize="sm">Açıklama</FormLabel>
                <Textarea bg="gray.700" borderColor="gray.600" color="white" rows={2} value={formData.description} onChange={e => setFormData((f: any) => ({ ...f, description: e.target.value }))} />
              </FormControl>
              <HStack w="full">
                <FormControl>
                  <FormLabel color="gray.400" fontSize="sm">Fiyat (USD)</FormLabel>
                  <NumberInput min={0} value={formData.price} onChange={(_, v) => setFormData((f: any) => ({ ...f, price: v || 0 }))}>
                    <NumberInputField bg="gray.700" borderColor="gray.600" color="white" />
                  </NumberInput>
                </FormControl>
                <FormControl>
                  <FormLabel color="gray.400" fontSize="sm">Süre (Gün)</FormLabel>
                  <NumberInput min={1} value={formData.durationDays} onChange={(_, v) => setFormData((f: any) => ({ ...f, durationDays: v || 30 }))}>
                    <NumberInputField bg="gray.700" borderColor="gray.600" color="white" />
                  </NumberInput>
                </FormControl>
              </HStack>
              <HStack w="full">
                <FormControl>
                  <FormLabel color="gray.400" fontSize="sm">Data (GB, 0=Sınırsız)</FormLabel>
                  <NumberInput min={0} value={formData.dataLimitGB} onChange={(_, v) => setFormData((f: any) => ({ ...f, dataLimitGB: v || 0 }))}>
                    <NumberInputField bg="gray.700" borderColor="gray.600" color="white" />
                  </NumberInput>
                </FormControl>
                <FormControl>
                  <FormLabel color="gray.400" fontSize="sm">Cihaz (0=Sınırsız)</FormLabel>
                  <NumberInput min={0} value={formData.userLimit} onChange={(_, v) => setFormData((f: any) => ({ ...f, userLimit: v || 0 }))}>
                    <NumberInputField bg="gray.700" borderColor="gray.600" color="white" />
                  </NumberInput>
                </FormControl>
              </HStack>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" color="gray.400" mr={3} onClick={onClose}>İptal</Button>
            <Button colorScheme="blue" onClick={handleSave}>Kaydet</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </VStack>
  );
};
