import {
  Badge,
  Box,
  Button,
  Divider,
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
  NumberInput,
  NumberInputField,
  Spinner,
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
import { PencilIcon, LockClosedIcon } from "@heroicons/react/24/outline";
import { chakra } from "@chakra-ui/react";
import { Footer } from "components/Footer";
import { Header } from "components/Header";
import { FC, useEffect, useState } from "react";
import { fetch } from "service/http";

const EditIcon = chakra(PencilIcon, { baseStyle: { w: 4, h: 4 } });
const LimitIcon = chakra(LockClosedIcon, { baseStyle: { w: 4, h: 4 } });

type AdminLimit = {
  username: string;
  is_sudo: boolean;
  users_limit: number | null;
  data_limit_gb: number | null;
  expire_days_limit: number | null;
};

const defaultLimit: AdminLimit = {
  username: "",
  is_sudo: false,
  users_limit: null,
  data_limit_gb: null,
  expire_days_limit: null,
};

export const AdminLimits: FC = () => {
  const [admins, setAdmins] = useState<AdminLimit[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<AdminLimit>(defaultLimit);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();

  const loadAdmins = () => {
    setLoading(true);
    fetch("/admins")
      .then((data: any) => {
        if (Array.isArray(data)) {
          setAdmins(
            data.map((a: any) => ({
              username: a.username,
              is_sudo: a.is_sudo,
              users_limit: a.users_limit ?? null,
              data_limit_gb: a.data_limit_gb ?? null,
              expire_days_limit: a.expire_days_limit ?? null,
            }))
          );
        }
      })
      .catch(() => {
        toast({ title: "Failed to load admins", status: "error", duration: 3000 });
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadAdmins();
  }, []);

  const openEdit = (admin: AdminLimit) => {
    setSelected({ ...admin });
    onOpen();
  };

  const saveLimit = () => {
    fetch(`/admin/${selected.username}`, {
      method: "PUT",
      body: {
        users_limit: selected.users_limit,
        data_limit_gb: selected.data_limit_gb,
        expire_days_limit: selected.expire_days_limit,
      },
    })
      .then(() => {
        toast({ title: "Limits updated", status: "success", duration: 2000 });
        onClose();
        loadAdmins();
      })
      .catch(() => {
        toast({ title: "Failed to update limits", status: "error", duration: 3000 });
      });
  };

  return (
    <VStack justifyContent="space-between" minH="100vh" p="6" rowGap={4}>
      <Box w="full">
        <Header />
        <Box mt={6}>
          <HStack mb={4}>
            <LimitIcon />
            <Heading size="md">Admin Limits</Heading>
          </HStack>
          <Text fontSize="sm" color="gray.500" mb={4}>
            Her admin için kullanıcı sayısı, data limiti ve süre kısıtlaması belirleyin.
          </Text>
          <Divider mb={4} />

          {loading ? (
            <HStack justify="center" py={10}>
              <Spinner />
            </HStack>
          ) : (
            <Box overflowX="auto" borderRadius="lg" borderWidth={1} _dark={{ borderColor: "gray.600" }}>
              <Table variant="simple">
                <Thead>
                  <Tr>
                    <Th>Admin</Th>
                    <Th>Rol</Th>
                    <Th>Max Kullanıcı</Th>
                    <Th>Max Data (GB)</Th>
                    <Th>Max Süre (gün)</Th>
                    <Th></Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {admins.map((admin) => (
                    <Tr key={admin.username}>
                      <Td fontWeight="semibold">{admin.username}</Td>
                      <Td>
                        <Badge colorScheme={admin.is_sudo ? "purple" : "blue"}>
                          {admin.is_sudo ? "Sudo" : "Normal"}
                        </Badge>
                      </Td>
                      <Td>
                        {admin.is_sudo ? (
                          <Text color="gray.400" fontSize="sm">Sınırsız</Text>
                        ) : (
                          <Text>{admin.users_limit ?? <Text as="span" color="gray.400">—</Text>}</Text>
                        )}
                      </Td>
                      <Td>
                        {admin.is_sudo ? (
                          <Text color="gray.400" fontSize="sm">Sınırsız</Text>
                        ) : (
                          <Text>{admin.data_limit_gb ?? <Text as="span" color="gray.400">—</Text>}</Text>
                        )}
                      </Td>
                      <Td>
                        {admin.is_sudo ? (
                          <Text color="gray.400" fontSize="sm">Sınırsız</Text>
                        ) : (
                          <Text>{admin.expire_days_limit ?? <Text as="span" color="gray.400">—</Text>}</Text>
                        )}
                      </Td>
                      <Td>
                        {!admin.is_sudo && (
                          <Tooltip label="Limitleri Düzenle">
                            <IconButton
                              size="sm"
                              variant="ghost"
                              aria-label="edit limits"
                              onClick={() => openEdit(admin)}
                            >
                              <EditIcon />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </Box>
          )}
        </Box>
      </Box>
      <Footer />

      <Modal isOpen={isOpen} onClose={onClose} isCentered>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Limit Düzenle: {selected.username}</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <FormControl>
                <FormLabel>Maksimum Kullanıcı Sayısı</FormLabel>
                <NumberInput
                  value={selected.users_limit ?? ""}
                  onChange={(v) =>
                    setSelected((s) => ({ ...s, users_limit: v ? Number(v) : null }))
                  }
                  min={0}
                >
                  <NumberInputField placeholder="Sınırsız" />
                </NumberInput>
              </FormControl>
              <FormControl>
                <FormLabel>Maksimum Data Limiti (GB)</FormLabel>
                <NumberInput
                  value={selected.data_limit_gb ?? ""}
                  onChange={(v) =>
                    setSelected((s) => ({ ...s, data_limit_gb: v ? Number(v) : null }))
                  }
                  min={0}
                >
                  <NumberInputField placeholder="Sınırsız" />
                </NumberInput>
              </FormControl>
              <FormControl>
                <FormLabel>Maksimum Süre (gün)</FormLabel>
                <NumberInput
                  value={selected.expire_days_limit ?? ""}
                  onChange={(v) =>
                    setSelected((s) => ({ ...s, expire_days_limit: v ? Number(v) : null }))
                  }
                  min={0}
                >
                  <NumberInputField placeholder="Sınırsız" />
                </NumberInput>
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>İptal</Button>
            <Button colorScheme="primary" onClick={saveLimit}>Kaydet</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </VStack>
  );
};

export default AdminLimits;
