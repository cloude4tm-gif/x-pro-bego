import {
  Box,
  Divider,
  chakra,
  HStack,
  IconButton,
  Menu,
  MenuButton,
  MenuGroup,
  MenuItem,
  MenuList,
  Text,
  useColorMode,
  VStack,
} from "@chakra-ui/react";
import {
  ArrowLeftOnRectangleIcon,
  Bars3Icon,
  BellAlertIcon,
  BoltIcon,
  ChartBarSquareIcon,
  ChartPieIcon,
  CircleStackIcon,
  Cog6ToothIcon,
  DocumentMinusIcon,
  GlobeAltIcon,
  KeyIcon,
  LinkIcon,
  LockClosedIcon,
  MoonIcon,
  NoSymbolIcon,
  SquaresPlusIcon,
  SunIcon,
  UserGroupIcon,
  WrenchScrewdriverIcon,
} from "@heroicons/react/24/outline";
import { useDashboard } from "contexts/DashboardContext";
import { FC, ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { updateThemeColor } from "utils/themeColor";
import { Language } from "./Language";
import useGetUser from "hooks/useGetUser";
import { XProLogo } from "assets/XProLogo";

type HeaderProps = {
  actions?: ReactNode;
};
const iconProps = {
  baseStyle: { w: 4, h: 4 },
};

const DarkIcon = chakra(MoonIcon, iconProps);
const LightIcon = chakra(SunIcon, iconProps);
const CoreSettingsIcon = chakra(Cog6ToothIcon, iconProps);
const SettingsIcon = chakra(Bars3Icon, iconProps);
const LogoutIcon = chakra(ArrowLeftOnRectangleIcon, iconProps);
const HostsIcon = chakra(LinkIcon, iconProps);
const NodesIcon = chakra(SquaresPlusIcon, iconProps);
const NodesUsageIcon = chakra(ChartPieIcon, iconProps);
const ResetUsageIcon = chakra(DocumentMinusIcon, iconProps);
const AdminSettingsIcon = chakra(WrenchScrewdriverIcon, iconProps);
const AdminLimitsIcon = chakra(LockClosedIcon, iconProps);
const ConnectionIcon = chakra(GlobeAltIcon, iconProps);
const AnalyticsIcon = chakra(ChartBarSquareIcon, iconProps);
const PlansIcon = chakra(CircleStackIcon, iconProps);
const ResellerIcon = chakra(UserGroupIcon, iconProps);
const ApiKeyIcon = chakra(KeyIcon, iconProps);
const IpIcon = chakra(NoSymbolIcon, iconProps);
const AuditIcon = chakra(DocumentMinusIcon, iconProps);
const WebhookIcon = chakra(LinkIcon, iconProps);
const BackupIcon = chakra(CircleStackIcon, iconProps);
const TelegramIcon = chakra(BellAlertIcon, iconProps);
const AutomationIcon = chakra(BoltIcon, iconProps);

export const Header: FC<HeaderProps> = ({ actions }) => {
  const { userData, getUserIsSuccess, getUserIsPending } = useGetUser();

  const isSudo = () => {
    if (!getUserIsPending && getUserIsSuccess) {
      return userData.is_sudo;
    }
    return false;
  };

  const {
    onEditingHosts,
    onResetAllUsage,
    onEditingNodes,
    onShowingNodesUsage,
  } = useDashboard();
  const { t } = useTranslation();
  const { colorMode, toggleColorMode } = useColorMode();

  return (
    <HStack
      gap={2}
      justifyContent="space-between"
      __css={{ "& .menuList": { direction: "ltr" } }}
      position="relative"
    >
      <Link to="/">
        <HStack spacing={3} alignItems="center" cursor="pointer">
          <Box w="40px" h="40px">
            <XProLogo />
          </Box>
          <VStack spacing={0} alignItems="flex-start">
            <Text fontWeight="bold" fontSize="lg" lineHeight="1.1" _dark={{ color: "white" }}>
              X-Pro
            </Text>
            <Text fontWeight="bold" fontSize="sm" lineHeight="1.1" color="primary.400">
              Bego Panel
            </Text>
          </VStack>
        </HStack>
      </Link>

      <Box overflow="auto" css={{ direction: "rtl" }}>
        <HStack alignItems="center">
          <Menu>
            <MenuButton
              as={IconButton}
              size="sm"
              variant="outline"
              icon={<SettingsIcon />}
              position="relative"
            />
            <MenuList minW="220px" zIndex={99999} className="menuList" maxH="80vh" overflowY="auto">
              {isSudo() && (
                <>
                  <MenuGroup title="Marzban" color="gray.500">
                    <MenuItem maxW="220px" fontSize="sm" icon={<HostsIcon />} onClick={onEditingHosts.bind(null, true)}>
                      {t("header.hostSettings")}
                    </MenuItem>
                    <MenuItem maxW="220px" fontSize="sm" icon={<NodesIcon />} onClick={onEditingNodes.bind(null, true)}>
                      {t("header.nodeSettings")}
                    </MenuItem>
                    <MenuItem maxW="220px" fontSize="sm" icon={<NodesUsageIcon />} onClick={onShowingNodesUsage.bind(null, true)}>
                      {t("header.nodesUsage")}
                    </MenuItem>
                    <MenuItem maxW="220px" fontSize="sm" icon={<ResetUsageIcon />} onClick={onResetAllUsage.bind(null, true)}>
                      {t("resetAllUsage")}
                    </MenuItem>
                  </MenuGroup>
                  <Divider borderColor="gray.700" />
                  <MenuGroup title="Analitik" color="gray.500">
                    <Link to="/analytics">
                      <MenuItem maxW="220px" fontSize="sm" icon={<AnalyticsIcon />}>
                        📊 Analitik & Raporlar
                      </MenuItem>
                    </Link>
                  </MenuGroup>
                  <Divider borderColor="gray.700" />
                  <MenuGroup title="Yönetim" color="gray.500">
                    <Link to="/admin-limits">
                      <MenuItem maxW="220px" fontSize="sm" icon={<AdminLimitsIcon />}>
                        Admin Limitleri
                      </MenuItem>
                    </Link>
                    <Link to="/settings">
                      <MenuItem maxW="220px" fontSize="sm" icon={<AdminSettingsIcon />}>
                        Admin Yöneticisi
                      </MenuItem>
                    </Link>
                    <Link to="/reseller-manager">
                      <MenuItem maxW="220px" fontSize="sm" icon={<ResellerIcon />}>
                        Reseller Yönetimi
                      </MenuItem>
                    </Link>
                    <Link to="/subscription-plans">
                      <MenuItem maxW="220px" fontSize="sm" icon={<PlansIcon />}>
                        Abonelik Planları
                      </MenuItem>
                    </Link>
                  </MenuGroup>
                  <Divider borderColor="gray.700" />
                  <MenuGroup title="Güvenlik" color="gray.500">
                    <Link to="/connection-logs">
                      <MenuItem maxW="220px" fontSize="sm" icon={<ConnectionIcon />}>
                        Bağlantı Logları
                      </MenuItem>
                    </Link>
                    <Link to="/audit-log">
                      <MenuItem maxW="220px" fontSize="sm" icon={<AuditIcon />}>
                        Denetim Logu
                      </MenuItem>
                    </Link>
                    <Link to="/ip-manager">
                      <MenuItem maxW="220px" fontSize="sm" icon={<IpIcon />}>
                        IP Yöneticisi
                      </MenuItem>
                    </Link>
                    <Link to="/api-keys">
                      <MenuItem maxW="220px" fontSize="sm" icon={<ApiKeyIcon />}>
                        API Key Yönetimi
                      </MenuItem>
                    </Link>
                  </MenuGroup>
                  <Divider borderColor="gray.700" />
                  <MenuGroup title="Otomasyon" color="gray.500">
                    <Link to="/telegram-bot">
                      <MenuItem maxW="220px" fontSize="sm" icon={<TelegramIcon />}>
                        🤖 Telegram Bot
                      </MenuItem>
                    </Link>
                    <Link to="/automation">
                      <MenuItem maxW="220px" fontSize="sm" icon={<AutomationIcon />}>
                        ⚡ Otomasyon
                      </MenuItem>
                    </Link>
                    <Link to="/webhooks">
                      <MenuItem maxW="220px" fontSize="sm" icon={<WebhookIcon />}>
                        Webhook Yönetimi
                      </MenuItem>
                    </Link>
                    <Link to="/backup">
                      <MenuItem maxW="220px" fontSize="sm" icon={<BackupIcon />}>
                        💾 Yedekleme
                      </MenuItem>
                    </Link>
                  </MenuGroup>
                  <Divider borderColor="gray.700" />
                </>
              )}
              <MenuItem
                maxW="220px"
                fontSize="sm"
                icon={<span>💎</span>}
                as="a"
                href="https://t.me/xprobego"
                target="_blank"
              >
                Happ Crypto
              </MenuItem>
              <MenuItem
                maxW="220px"
                fontSize="sm"
                icon={<span>🎁</span>}
                as="a"
                href="https://t.me/xprobego"
                target="_blank"
              >
                Donation
              </MenuItem>
              <Link to="/login">
                <MenuItem maxW="220px" fontSize="sm" icon={<LogoutIcon />}>
                  {t("header.logout")}
                </MenuItem>
              </Link>
            </MenuList>
          </Menu>

          {isSudo() && (
            <IconButton
              size="sm"
              variant="outline"
              aria-label="core settings"
              onClick={() => {
                useDashboard.setState({ isEditingCore: true });
              }}
            >
              <CoreSettingsIcon />
            </IconButton>
          )}

          <Language />

          <IconButton
            size="sm"
            variant="outline"
            aria-label="switch theme"
            onClick={() => {
              updateThemeColor(colorMode == "dark" ? "light" : "dark");
              toggleColorMode();
            }}
          >
            {colorMode === "light" ? <DarkIcon /> : <LightIcon />}
          </IconButton>
        </HStack>
      </Box>
    </HStack>
  );
};
