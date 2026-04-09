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
  Text,
  Textarea,
  VStack,
  useDisclosure,
  useToast,
} from "@chakra-ui/react";
import {
  PencilIcon,
  PlusIcon,
  SparklesIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import { chakra } from "@chakra-ui/react";
import { FC, useState } from "react";
import { Header } from "components/Header";

const EditIcon = chakra(PencilIcon, { baseStyle: { w: 4, h: 4 } });
const DeleteIcon = chakra(TrashIcon, { baseStyle: { w: 4, h: 4 } });
const AddIcon = chakra(PlusIcon, { baseStyle: { w: 4, h: 4 } });
const StarIcon = chakra(SparklesIcon, { baseStyle: { w: 5, h: 5 } });

interface Plan {
  id: number;
  name: string;
  emoji: string;
  color: string;
  price: number;
  currency: string;
  dataLimitGB: number;
  durationDays: number;
  userLimit: number;
  description: string;
  activeUsers: number;
  popular?: boolean;
}

const defaultPlans: Plan[] = [
  {
    id: 1,
    name: "Bronze",
    emoji: "🥉",
    color: "orange",
    price: 5,
    currency: "USD",
    dataLimitGB: 30,
    durationDays: 30,
    userLimit: 1,
    description: "Bireysel kullanım için temel paket",
    activeUsers: 142,
  },
  {
    id: 2,
    name: "Silver",
    emoji: "🥈",
    color: "blue",
    price: 10,
    currency: "USD",
    dataLimitGB: 100,
    durationDays: 30,
    userLimit: 3,
    description: "Aile ve küçük grup kullanımı için ideal",
    activeUsers: 87,
    popular: true,
  },
  {
    id: 3,
    name: "Gold",
    emoji: "🥇",
    color: "yellow",
    price: 20,
    currency: "USD",
    dataLimitGB: 500,
    durationDays: 30,
    userLimit: 10,
    description: "İş ve yoğun kullanım için sınırsıza yakın",
    activeUsers: 34,
  },
  {
    id: 4,
    name: "Platinum",
    emoji: "💎",
    color: "purple",
    price: 50,
    currency: "USD",
    dataLimitGB: 0,
    durationDays: 30,
    userLimit: 0,
    description: "Sınırsız data ve kullanıcı — kurumsal",
    activeUsers: 12,
  },
];

const emptyPlan: Omit<Plan, "id" | "activeUsers"> = {
  name: "",
  emoji: "⭐",
  color: "blue",
  price: 0,
  currency: "USD",
  dataLimitGB: 0,
  durationDays: 30,
  userLimit: 1,
  description: "",
};

export const SubscriptionPlans: FC = () => {
  const [plans, setPlans] = useState<Plan[]>(defaultPlans);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [formData, setFormData] = useState<Omit<Plan, "id" | "activeUsers">>(emptyPlan);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();

  const openCreate = () => {
    setEditingPlan(null);
    setFormData(emptyPlan);
    onOpen();
  };

  const openEdit = (plan: Plan) => {
    setEditingPlan(plan);
    setFormData({
      name: plan.name,
      emoji: plan.emoji,
      color: plan.color,
      price: plan.price,
      currency: plan.currency,
      dataLimitGB: plan.dataLimitGB,
      durationDays: plan.durationDays,
      userLimit: plan.userLimit,
      description: plan.description,
      popular: plan.popular,
    });
    onOpen();
  };

  const handleSave = () => {
    if (!formData.name) return;
    if (editingPlan) {
      setPlans((prev) => prev.map((p) => (p.id === editingPlan.id ? { ...p, ...formData } : p)));
      toast({ title: "Plan güncellendi", status: "success", duration: 2000 });
    } else {
      const newId = Math.max(...plans.map((p) => p.id)) + 1;
      setPlans((prev) => [...prev, { ...formData, id: newId, activeUsers: 0 }]);
      toast({ title: "Plan oluşturuldu", status: "success", duration: 2000 });
    }
    onClose();
  };

  const handleDelete = (id: number) => {
    setPlans((prev) => prev.filter((p) => p.id !== id));
    toast({ title: "Plan silindi", status: "info", duration: 2000 });
  };

  const totalRevenue = plans.reduce((sum, p) => sum + p.price * p.activeUsers, 0);
  const totalUsers = plans.reduce((sum, p) => sum + p.activeUsers, 0);

  return (
    <VStack w="full" minH="100vh" bg="gray.900" spacing={0}>
      <Box w="full" px={6} py={3} borderBottom="1px solid" borderColor="gray.700">
        <Header />
      </Box>
      <Box w="full" maxW="1400px" mx="auto" px={6} py={6}>
        <HStack justify="space-between" mb={6} flexWrap="wrap" gap={3}>
          <HStack>
            <StarIcon color="yellow.400" />
            <Heading size="md" color="white">Abonelik Planları</Heading>
          </HStack>
          <Button size="sm" leftIcon={<AddIcon />} colorScheme="blue" onClick={openCreate}>
            Yeni Plan
          </Button>
        </HStack>

        <Grid templateColumns={{ base: "1fr", md: "repeat(3, 1fr)" }} gap={4} mb={8}>
          <Box bg="gray.800" borderRadius="xl" p={4} border="1px solid" borderColor="gray.700">
            <Text color="gray.400" fontSize="sm">Toplam Aylık Gelir</Text>
            <Text color="green.400" fontSize="2xl" fontWeight="bold">${totalRevenue.toLocaleString()}</Text>
          </Box>
          <Box bg="gray.800" borderRadius="xl" p={4} border="1px solid" borderColor="gray.700">
            <Text color="gray.400" fontSize="sm">Aktif Aboneler</Text>
            <Text color="blue.400" fontSize="2xl" fontWeight="bold">{totalUsers}</Text>
          </Box>
          <Box bg="gray.800" borderRadius="xl" p={4} border="1px solid" borderColor="gray.700">
            <Text color="gray.400" fontSize="sm">Plan Sayısı</Text>
            <Text color="purple.400" fontSize="2xl" fontWeight="bold">{plans.length}</Text>
          </Box>
        </Grid>

        <Grid templateColumns={{ base: "1fr", md: "repeat(2, 1fr)", lg: "repeat(4, 1fr)" }} gap={5}>
          {plans.map((plan) => (
            <Box
              key={plan.id}
              bg="gray.800"
              borderRadius="2xl"
              border="2px solid"
              borderColor={plan.popular ? `${plan.color}.500` : "gray.700"}
              overflow="hidden"
              position="relative"
            >
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
                  ${plan.price}
                  <Text as="span" fontSize="sm" fontWeight="normal" color="gray.400"> /ay</Text>
                </Text>

                <Divider my={4} borderColor="gray.700" />

                <VStack align="start" spacing={2} mb={4}>
                  <HStack>
                    <Badge colorScheme="green">Data</Badge>
                    <Text fontSize="sm" color="gray.300">
                      {plan.dataLimitGB === 0 ? "Sınırsız" : `${plan.dataLimitGB} GB`}
                    </Text>
                  </HStack>
                  <HStack>
                    <Badge colorScheme="blue">Süre</Badge>
                    <Text fontSize="sm" color="gray.300">{plan.durationDays} gün</Text>
                  </HStack>
                  <HStack>
                    <Badge colorScheme="purple">Cihaz</Badge>
                    <Text fontSize="sm" color="gray.300">
                      {plan.userLimit === 0 ? "Sınırsız" : `${plan.userLimit} kullanıcı`}
                    </Text>
                  </HStack>
                </VStack>

                <Box bg="gray.700" borderRadius="lg" p={3} mb={4}>
                  <Text fontSize="xs" color="gray.400">Aktif Abone</Text>
                  <Text fontSize="lg" fontWeight="bold" color="white">{plan.activeUsers}</Text>
                  <Text fontSize="xs" color="green.400">${(plan.price * plan.activeUsers).toLocaleString()} /ay gelir</Text>
                </Box>

                <HStack>
                  <Button size="sm" leftIcon={<EditIcon />} variant="outline" colorScheme="blue" flex={1} onClick={() => openEdit(plan)}>
                    Düzenle
                  </Button>
                  <IconButton
                    size="sm"
                    icon={<DeleteIcon />}
                    aria-label="Sil"
                    colorScheme="red"
                    variant="outline"
                    onClick={() => handleDelete(plan.id)}
                  />
                </HStack>
              </Box>
            </Box>
          ))}
        </Grid>
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
                  <Input
                    bg="gray.700"
                    borderColor="gray.600"
                    color="white"
                    value={formData.emoji}
                    onChange={(e) => setFormData((f) => ({ ...f, emoji: e.target.value }))}
                    fontSize="xl"
                    textAlign="center"
                  />
                </FormControl>
                <FormControl flex={1}>
                  <FormLabel color="gray.400" fontSize="sm">Plan Adı</FormLabel>
                  <Input
                    bg="gray.700"
                    borderColor="gray.600"
                    color="white"
                    placeholder="Bronze, Silver..."
                    value={formData.name}
                    onChange={(e) => setFormData((f) => ({ ...f, name: e.target.value }))}
                  />
                </FormControl>
              </HStack>
              <FormControl>
                <FormLabel color="gray.400" fontSize="sm">Açıklama</FormLabel>
                <Textarea
                  bg="gray.700"
                  borderColor="gray.600"
                  color="white"
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData((f) => ({ ...f, description: e.target.value }))}
                />
              </FormControl>
              <HStack w="full">
                <FormControl>
                  <FormLabel color="gray.400" fontSize="sm">Fiyat (USD)</FormLabel>
                  <NumberInput min={0} value={formData.price} onChange={(_, v) => setFormData((f) => ({ ...f, price: v || 0 }))}>
                    <NumberInputField bg="gray.700" borderColor="gray.600" color="white" />
                  </NumberInput>
                </FormControl>
                <FormControl>
                  <FormLabel color="gray.400" fontSize="sm">Süre (Gün)</FormLabel>
                  <NumberInput min={1} value={formData.durationDays} onChange={(_, v) => setFormData((f) => ({ ...f, durationDays: v || 30 }))}>
                    <NumberInputField bg="gray.700" borderColor="gray.600" color="white" />
                  </NumberInput>
                </FormControl>
              </HStack>
              <HStack w="full">
                <FormControl>
                  <FormLabel color="gray.400" fontSize="sm">Data Limiti (GB, 0=Sınırsız)</FormLabel>
                  <NumberInput min={0} value={formData.dataLimitGB} onChange={(_, v) => setFormData((f) => ({ ...f, dataLimitGB: v || 0 }))}>
                    <NumberInputField bg="gray.700" borderColor="gray.600" color="white" />
                  </NumberInput>
                </FormControl>
                <FormControl>
                  <FormLabel color="gray.400" fontSize="sm">Kullanıcı Limiti (0=Sınırsız)</FormLabel>
                  <NumberInput min={0} value={formData.userLimit} onChange={(_, v) => setFormData((f) => ({ ...f, userLimit: v || 0 }))}>
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
