import {
  Alert,
  AlertDescription,
  AlertIcon,
  Badge,
  Box,
  Button,
  chakra,
  Checkbox,
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
  NumberDecrementStepper,
  NumberIncrementStepper,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  Spinner,
  Table,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  VStack,
  useColorModeValue,
  useDisclosure,
  useToast,
} from "@chakra-ui/react";
import {
  PencilSquareIcon,
  PlusCircleIcon,
  TrashIcon,
  ArrowLeftIcon,
} from "@heroicons/react/24/outline";
import { FC, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { fetcher } from "service/http";

const EditIcon = chakra(PencilSquareIcon, { baseStyle: { w: 4, h: 4 } });
const DeleteIcon = chakra(TrashIcon, { baseStyle: { w: 4, h: 4 } });
const AddIcon = chakra(PlusCircleIcon, { baseStyle: { w: 5, h: 5 } });
const BackIcon = chakra(ArrowLeftIcon, { baseStyle: { w: 4, h: 4 } });

type Admin = {
  username: string;
  is_sudo: boolean;
  password?: string;
  telegram_id?: number | null;
  discord_webhook?: string | null;
};

const emptyAdmin: Admin = {
  username: "",
  password: "",
  is_sudo: false,
  telegram_id: null,
  discord_webhook: null,
};

export const Settings: FC = () => {
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editTarget, setEditTarget] = useState<Admin | null>(null);
  const [form, setForm] = useState<Admin>(emptyAdmin);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const {
    isOpen: isDeleteOpen,
    onOpen: onDeleteOpen,
    onClose: onDeleteClose,
  } = useDisclosure();
  const toast = useToast();
  const bg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.600");

  const loadAdmins = () => {
    setLoading(true);
    setError("");
    fetcher<Admin[]>("/admins")
      .then(setAdmins)
      .catch(() => setError("Failed to load admins. Make sure you are a sudo admin."))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadAdmins();
  }, []);

  const openCreate = () => {
    setEditTarget(null);
    setForm(emptyAdmin);
    onOpen();
  };

  const openEdit = (admin: Admin) => {
    setEditTarget(admin);
    setForm({ ...admin, password: "" });
    onOpen();
  };

  const handleSave = () => {
    if (!form.username) return;
    setSaving(true);
    const body: any = {
      username: form.username,
      is_sudo: form.is_sudo,
    };
    if (form.password) body.password = form.password;
    if (form.telegram_id) body.telegram_id = Number(form.telegram_id);
    if (form.discord_webhook) body.discord_webhook = form.discord_webhook;

    const req = editTarget
      ? fetcher(`/admin/${editTarget.username}`, { method: "put", body })
      : fetcher("/admin", { method: "post", body });

    req
      .then(() => {
        toast({
          title: editTarget ? "Admin updated." : "Admin created.",
          status: "success",
          duration: 3000,
          isClosable: true,
        });
        onClose();
        loadAdmins();
      })
      .catch((err) => {
        toast({
          title: "Error",
          description: err?.response?._data?.detail || err?.message || "Operation failed",
          status: "error",
          duration: 4000,
          isClosable: true,
        });
      })
      .finally(() => setSaving(false));
  };

  const confirmDelete = (username: string) => {
    setDeleteTarget(username);
    onDeleteOpen();
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    setDeleting(true);
    fetcher(`/admin/${deleteTarget}`, { method: "delete" })
      .then(() => {
        toast({
          title: `Admin "${deleteTarget}" deleted.`,
          status: "success",
          duration: 3000,
          isClosable: true,
        });
        onDeleteClose();
        loadAdmins();
      })
      .catch((err) => {
        toast({
          title: "Error",
          description: err?.response?._data?.detail || err?.message || "Delete failed",
          status: "error",
          duration: 4000,
          isClosable: true,
        });
      })
      .finally(() => setDeleting(false));
  };

  return (
    <Box maxW="900px" mx="auto" py={8} px={4}>
      <HStack mb={6} spacing={3}>
        <Link to="/">
          <IconButton
            size="sm"
            variant="ghost"
            aria-label="back"
            icon={<BackIcon />}
          />
        </Link>
        <Heading size="lg">Settings</Heading>
      </HStack>

      <Box
        bg={bg}
        border="1px solid"
        borderColor={borderColor}
        rounded="xl"
        p={6}
        shadow="sm"
      >
        <HStack justifyContent="space-between" mb={4}>
          <Heading size="md">Admin Manager</Heading>
          <Button
            leftIcon={<AddIcon />}
            colorScheme="primary"
            size="sm"
            onClick={openCreate}
          >
            Add Admin
          </Button>
        </HStack>

        {error && (
          <Alert status="warning" rounded="md" mb={4}>
            <AlertIcon />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {loading ? (
          <HStack justifyContent="center" py={8}>
            <Spinner />
          </HStack>
        ) : (
          <Box overflowX="auto">
            <Table size="sm" variant="simple">
              <Thead>
                <Tr>
                  <Th>Username</Th>
                  <Th>Role</Th>
                  <Th textAlign="right">Actions</Th>
                </Tr>
              </Thead>
              <Tbody>
                {admins.length === 0 && (
                  <Tr>
                    <Td colSpan={3} textAlign="center" color="gray.400" py={6}>
                      No admins found.
                    </Td>
                  </Tr>
                )}
                {admins.map((admin) => (
                  <Tr key={admin.username}>
                    <Td fontFamily="mono">{admin.username}</Td>
                    <Td>
                      <Badge colorScheme={admin.is_sudo ? "purple" : "blue"}>
                        {admin.is_sudo ? "Sudo" : "Admin"}
                      </Badge>
                    </Td>
                    <Td textAlign="right">
                      <HStack justifyContent="flex-end" spacing={2}>
                        <IconButton
                          size="xs"
                          variant="outline"
                          aria-label="edit"
                          icon={<EditIcon />}
                          onClick={() => openEdit(admin)}
                        />
                        <IconButton
                          size="xs"
                          variant="outline"
                          colorScheme="red"
                          aria-label="delete"
                          icon={<DeleteIcon />}
                          onClick={() => confirmDelete(admin.username)}
                        />
                      </HStack>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </Box>
        )}
      </Box>

      <Modal isOpen={isOpen} onClose={onClose} isCentered>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>{editTarget ? "Edit Admin" : "New Admin"}</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <FormControl isRequired>
                <FormLabel fontSize="sm">Username</FormLabel>
                <Input
                  size="sm"
                  value={form.username}
                  isReadOnly={!!editTarget}
                  onChange={(e) => setForm({ ...form, username: e.target.value })}
                  placeholder="admin_username"
                />
              </FormControl>
              <FormControl>
                <FormLabel fontSize="sm">
                  Password{editTarget ? " (leave blank to keep current)" : ""}
                </FormLabel>
                <Input
                  size="sm"
                  type="password"
                  value={form.password || ""}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder={editTarget ? "••••••" : "New password"}
                />
              </FormControl>
              <FormControl>
                <FormLabel fontSize="sm">Telegram ID (optional)</FormLabel>
                <NumberInput
                  size="sm"
                  value={form.telegram_id ?? ""}
                  onChange={(_, val) =>
                    setForm({ ...form, telegram_id: isNaN(val) ? null : val })
                  }
                >
                  <NumberInputField placeholder="e.g. 123456789" />
                  <NumberInputStepper>
                    <NumberIncrementStepper />
                    <NumberDecrementStepper />
                  </NumberInputStepper>
                </NumberInput>
              </FormControl>
              <FormControl>
                <FormLabel fontSize="sm">Discord Webhook (optional)</FormLabel>
                <Input
                  size="sm"
                  value={form.discord_webhook || ""}
                  onChange={(e) =>
                    setForm({ ...form, discord_webhook: e.target.value || null })
                  }
                  placeholder="https://discord.com/api/webhooks/..."
                />
              </FormControl>
              <FormControl>
                <Checkbox
                  isChecked={form.is_sudo}
                  onChange={(e) => setForm({ ...form, is_sudo: e.target.checked })}
                  colorScheme="purple"
                >
                  <Text fontSize="sm">Sudo (full access)</Text>
                </Checkbox>
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose} size="sm">
              Cancel
            </Button>
            <Button
              colorScheme="primary"
              size="sm"
              isLoading={saving}
              onClick={handleSave}
              isDisabled={!form.username}
            >
              {editTarget ? "Update" : "Create"}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <Modal isOpen={isDeleteOpen} onClose={onDeleteClose} isCentered size="sm">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Delete Admin</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Text>
              Are you sure you want to delete{" "}
              <Text as="span" fontWeight="bold" fontFamily="mono">
                {deleteTarget}
              </Text>
              ?
            </Text>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onDeleteClose} size="sm">
              Cancel
            </Button>
            <Button
              colorScheme="red"
              size="sm"
              isLoading={deleting}
              onClick={handleDelete}
            >
              Delete
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default Settings;
