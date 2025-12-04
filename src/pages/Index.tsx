import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import Icon from '@/components/ui/icon';
import { toast } from '@/hooks/use-toast';

type UserRole = 'passenger' | 'driver';
type OrderStatus = 'searching' | 'found' | 'accepted' | 'completed';
type ExtraOptionType = 'childSeat' | 'smallPet' | 'largePet';
type PaymentMethod = 'card' | 'cash' | 'qr';
type SubscriptionStatus = 'trial' | 'active' | 'expired' | 'none';

interface ChatMessage {
  id: string;
  sender: 'user' | 'driver';
  text: string;
  time: string;
}

interface DriverSubscription {
  status: SubscriptionStatus;
  trialEndsAt?: Date;
  subscriptionEndsAt?: Date;
  isTrialUsed: boolean;
}

interface Referral {
  id: string;
  name: string;
  status: 'pending' | 'active';
  bonus: number;
  date: string;
}

interface Order {
  id: string;
  from: string;
  to: string;
  status: OrderStatus;
  driverName?: string;
  carNumber?: string;
  arrivalTime?: number;
  price?: number;
  distance?: number;
  date?: string;
  time?: string;
  rating?: number;
  review?: string;
  driverRating?: number;
  driverLocation?: { lat: number; lng: number };
  userLocation?: { lat: number; lng: number };
  paymentMethod?: PaymentMethod;
  isPaid?: boolean;
  extraOptions?: ExtraOptionType[];
  waitingMinutes?: number;
  detourMinutes?: number;
}

interface ExtraOption {
  id: ExtraOptionType;
  name: string;
  icon: string;
  price: number;
  description: string;
}

const Index = () => {
  const [role, setRole] = useState<UserRole>('passenger');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [ratingDialogOpen, setRatingDialogOpen] = useState(false);
  const [selectedOrderForRating, setSelectedOrderForRating] = useState<Order | null>(null);
  const [tempRating, setTempRating] = useState(0);
  const [tempReview, setTempReview] = useState('');
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [trackingDriver, setTrackingDriver] = useState(false);
  const driverMoveInterval = useRef<NodeJS.Timeout | null>(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const chatScrollRef = useRef<HTMLDivElement>(null);
  const [currentOrder, setCurrentOrder] = useState<Order | null>(null);
  const [incomingOrders, setIncomingOrders] = useState<Order[]>([]);
  const [activeSection, setActiveSection] = useState<string>('order');
  const [selectedExtraOptions, setSelectedExtraOptions] = useState<ExtraOptionType[]>([]);
  const [estimatedPrice, setEstimatedPrice] = useState<number | null>(null);
  const [waitingMinutes, setWaitingMinutes] = useState(0);
  const [detourMinutes, setDetourMinutes] = useState(0);
  const [orderHistory, setOrderHistory] = useState<Order[]>([]);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod>('card');
  const [selectedOrderForPayment, setSelectedOrderForPayment] = useState<Order | null>(null);
  const [qrCodeGenerated, setQrCodeGenerated] = useState(false);
  const [subscriptionDialogOpen, setSubscriptionDialogOpen] = useState(false);
  const [referralDialogOpen, setReferralDialogOpen] = useState(false);
  const [referralCode, setReferralCode] = useState('YUGO-DRV-12345');
  const [referrals, setReferrals] = useState<Referral[]>([
    { id: '1', name: 'Иван П.', status: 'active', bonus: 300, date: '10.11.2024' },
    { id: '2', name: 'Мария С.', status: 'active', bonus: 300, date: '15.11.2024' },
    { id: '3', name: 'Дмитрий К.', status: 'pending', bonus: 0, date: '01.12.2024' },
  ]);
  const [totalReferralBonus, setTotalReferralBonus] = useState(600);
  const [isDriverWorking, setIsDriverWorking] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [driverSubscription, setDriverSubscription] = useState<DriverSubscription>({
    status: 'none',
    isTrialUsed: false
  });
  
  useEffect(() => {
    if (role === 'driver' && driverSubscription.status === 'none') {
      setTimeout(() => setSubscriptionDialogOpen(true), 1000);
    }
  }, [role, driverSubscription.status]);

  useEffect(() => {
    if ('Notification' in window && notificationsEnabled) {
      Notification.requestPermission();
    }
  }, [notificationsEnabled]);

  useEffect(() => {
    if (role === 'driver' && isDriverWorking && incomingOrders.length > 0) {
      const latestOrder = incomingOrders[incomingOrders.length - 1];
      
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('🚖 Новый заказ!', {
          body: `${latestOrder.from} → ${latestOrder.to}\nЦена: ${latestOrder.price}₽`,
          icon: '/favicon.ico',
          badge: '/favicon.ico',
          tag: latestOrder.id,
          requireInteraction: true,
        });
      }

      const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIGGi78OWgTRALUKXh8bllHgU2jdXzzn0vBSl+zPLaizsKE12y6OyrWBgLRp7d8sFwIwUrgs/y2Ik3CBlou+/mok0QC0+k4fK3ZBwGNo7V8s9+LgUpcM3y2Yw6ChNdsujs');
      audio.play().catch(() => {});
    }
  }, [incomingOrders, role, isDriverWorking]);

  const toggleDriverWork = () => {
    const newStatus = !isDriverWorking;
    setIsDriverWorking(newStatus);
    
    if (newStatus) {
      setNotificationsEnabled(true);
      toast({
        title: '✅ Статус обновлен',
        description: 'Вы в сети! Заказы начнут поступать.',
      });
    } else {
      toast({
        title: '⏸️ Статус обновлен',
        description: 'Вы не в сети. Заказы не будут поступать.',
      });
    }
  };

  const extraOptions: ExtraOption[] = [
    {
      id: 'childSeat',
      name: 'Детское кресло',
      icon: 'Baby',
      price: 50,
      description: '+50₽',
    },
    {
      id: 'smallPet',
      name: 'С животным (мелкие/средние)',
      icon: 'Cat',
      price: 100,
      description: '+100₽',
    },
    {
      id: 'largePet',
      name: 'С животным (крупные)',
      icon: 'Dog',
      price: 200,
      description: '+200₽',
    },
  ];

  const PRICE_PER_KM = 40;
  const FREE_WAITING_MINUTES = 3;
  const WAITING_PRICE_PER_MINUTE = 5;
  const FREE_DETOUR_MINUTES = 10;
  const DETOUR_PRICE_PER_MINUTE = 5;
  const DETOUR_BASE_PRICE = 50;

  const calculatePrice = (
    distance: number, 
    extras: ExtraOptionType[] = [], 
    waiting: number = 0, 
    detour: number = 0
  ): number => {
    let price = distance * PRICE_PER_KM;
    
    extras.forEach(extraId => {
      const extra = extraOptions.find(e => e.id === extraId);
      if (extra) price += extra.price;
    });
    
    if (waiting > FREE_WAITING_MINUTES) {
      price += (waiting - FREE_WAITING_MINUTES) * WAITING_PRICE_PER_MINUTE;
    }
    
    if (detour > 0) {
      if (detour <= FREE_DETOUR_MINUTES) {
        price += DETOUR_BASE_PRICE;
      } else {
        price += DETOUR_BASE_PRICE + (detour - FREE_DETOUR_MINUTES) * DETOUR_PRICE_PER_MINUTE;
      }
    }
    
    return Math.round(price);
  };

  const toggleExtraOption = (optionId: ExtraOptionType) => {
    if (optionId === 'smallPet' || optionId === 'largePet') {
      const otherPetOption = optionId === 'smallPet' ? 'largePet' : 'smallPet';
      const filtered = selectedExtraOptions.filter(id => id !== otherPetOption && id !== optionId);
      if (!selectedExtraOptions.includes(optionId)) {
        setSelectedExtraOptions([...filtered, optionId]);
      } else {
        setSelectedExtraOptions(filtered);
      }
    } else {
      setSelectedExtraOptions(prev => 
        prev.includes(optionId) 
          ? prev.filter(id => id !== optionId)
          : [...prev, optionId]
      );
    }
  };

  const calculateStats = () => {
    const totalTrips = orderHistory.length;
    const totalSpent = orderHistory.reduce((sum, order) => sum + (order.price || 0), 0);
    const totalDistance = orderHistory.reduce((sum, order) => sum + (order.distance || 0), 0);
    const averageRating = orderHistory.filter(o => o.rating).length > 0
      ? (orderHistory.reduce((sum, order) => sum + (order.rating || 0), 0) / orderHistory.filter(o => o.rating).length).toFixed(1)
      : '0';
    const bonusPoints = Math.floor(totalSpent / 10);
    const level = Math.floor(totalTrips / 5) + 1;
    const tripsToNextLevel = 5 - (totalTrips % 5);
    
    return {
      totalTrips,
      totalSpent,
      totalDistance,
      averageRating,
      bonusPoints,
      level,
      tripsToNextLevel,
    };
  };

  const stats = calculateStats();

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
          toast({
            title: '📍 Геолокация',
            description: 'Ваше местоположение определено',
          });
        },
        (error) => {
          console.log('Geolocation error:', error);
          setUserLocation({ lat: 55.7558, lng: 37.6173 });
        }
      );
    } else {
      setUserLocation({ lat: 55.7558, lng: 37.6173 });
    }
  }, []);

  useEffect(() => {
    if (trackingDriver && currentOrder?.driverLocation) {
      driverMoveInterval.current = setInterval(() => {
        setCurrentOrder((prev) => {
          if (!prev || !prev.driverLocation || !userLocation) return prev;
          
          const latDiff = userLocation.lat - prev.driverLocation.lat;
          const lngDiff = userLocation.lng - prev.driverLocation.lng;
          
          const newLat = prev.driverLocation.lat + latDiff * 0.1;
          const newLng = prev.driverLocation.lng + lngDiff * 0.1;
          
          const distance = Math.sqrt(
            Math.pow(userLocation.lat - newLat, 2) + Math.pow(userLocation.lng - newLng, 2)
          );
          
          if (distance < 0.001) {
            setTrackingDriver(false);
            if (driverMoveInterval.current) clearInterval(driverMoveInterval.current);
            toast({
              title: '🎉 Водитель прибыл!',
              description: 'Водитель ждёт вас',
            });
          }
          
          return {
            ...prev,
            driverLocation: { lat: newLat, lng: newLng },
          };
        });
      }, 1000);
    }
    
    return () => {
      if (driverMoveInterval.current) clearInterval(driverMoveInterval.current);
    };
  }, [trackingDriver, userLocation]);

  const calculateEstimate = () => {
    if (!from || !to) return;
    const randomDistance = Math.floor(Math.random() * 20) + 3;
    const price = calculatePrice(randomDistance, selectedExtraOptions, waitingMinutes, detourMinutes);
    setEstimatedPrice(price);
    
    let details = `~${randomDistance} км × ${PRICE_PER_KM}₽`;
    if (selectedExtraOptions.length > 0) {
      details += '\n+ Доп. услуги';
    }
    if (waitingMinutes > FREE_WAITING_MINUTES) {
      details += `\n+ Ожидание ${waitingMinutes - FREE_WAITING_MINUTES} мин`;
    }
    if (detourMinutes > 0) {
      details += `\n+ Заезд ${detourMinutes} мин`;
    }
    
    toast({
      title: `💰 ${price} ₽`,
      description: details,
    });
  };

  const handleCreateOrder = () => {
    if (!from || !to) {
      toast({
        title: 'Ошибка',
        description: 'Заполните адреса',
        variant: 'destructive',
      });
      return;
    }

    const randomDistance = Math.floor(Math.random() * 20) + 3;
    const calculatedPrice = calculatePrice(randomDistance, selectedExtraOptions, waitingMinutes, detourMinutes);

    const now = new Date();
    const newOrder: Order = {
      id: Date.now().toString(),
      from,
      to,
      status: 'searching',
      price: calculatedPrice,
      distance: randomDistance,
      date: now.toLocaleDateString('ru-RU'),
      time: now.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
      extraOptions: selectedExtraOptions,
      waitingMinutes,
      detourMinutes,
    };

    setCurrentOrder(newOrder);
    setIncomingOrders([...incomingOrders, newOrder]);

    toast({
      title: '🚕 Ищем водителя',
      description: 'Подбираем ближайшее авто...',
    });

    setTimeout(() => {
      const driverRating = (Math.random() * 2 + 3).toFixed(1);
      const driverLat = userLocation ? userLocation.lat + (Math.random() * 0.02 - 0.01) : 55.7558;
      const driverLng = userLocation ? userLocation.lng + (Math.random() * 0.02 - 0.01) : 37.6173;
      
      const updatedOrder = {
        ...newOrder,
        status: 'found' as OrderStatus,
        driverName: 'Иван Петров',
        carNumber: 'А777АА777',
        arrivalTime: 5,
        driverRating: parseFloat(driverRating),
        userLocation: userLocation || { lat: 55.7558, lng: 37.6173 },
        driverLocation: { lat: driverLat, lng: driverLng },
      };
      setCurrentOrder(updatedOrder);
      setTrackingDriver(true);
      
      const completedOrder = { ...updatedOrder, status: 'completed' as OrderStatus };
      setOrderHistory([completedOrder, ...orderHistory]);
      
      toast({
        title: '✅ Водитель найден!',
        description: `${updatedOrder.driverName} • ${updatedOrder.carNumber}`,
      });
    }, 2000);
  };

  const handleAcceptOrder = (orderId: string) => {
    const order = incomingOrders.find((o) => o.id === orderId);
    if (order) {
      const acceptedOrder = {
        ...order,
        status: 'completed' as OrderStatus,
        driverName: 'Вы',
        carNumber: 'В555ВВ555',
        arrivalTime: 3,
      };
      setIncomingOrders(incomingOrders.filter((o) => o.id !== orderId));
      setOrderHistory([acceptedOrder, ...orderHistory]);
      toast({
        title: '✅ Заказ принят',
        description: `${order.from} → ${order.to}`,
      });
    }
  };

  const handleRejectOrder = (orderId: string) => {
    setIncomingOrders(incomingOrders.filter((o) => o.id !== orderId));
    toast({
      title: 'Заказ отклонён',
      variant: 'destructive',
    });
  };

  const openRatingDialog = (order: Order) => {
    setSelectedOrderForRating(order);
    setTempRating(order.rating || 0);
    setTempReview(order.review || '');
    setRatingDialogOpen(true);
  };

  const submitRating = () => {
    if (!selectedOrderForRating) return;
    
    const updatedHistory = orderHistory.map(order => 
      order.id === selectedOrderForRating.id 
        ? { ...order, rating: tempRating, review: tempReview }
        : order
    );
    
    setOrderHistory(updatedHistory);
    setRatingDialogOpen(false);
    
    toast({
      title: '⭐ Спасибо за отзыв!',
      description: `Вы оценили поездку на ${tempRating} звёзд`,
    });
  };

  const openPaymentDialog = (order: Order) => {
    setSelectedOrderForPayment(order);
    setSelectedPaymentMethod('card');
    setQrCodeGenerated(false);
    setPaymentDialogOpen(true);
  };

  const processPayment = () => {
    if (!selectedOrderForPayment) return;
    
    if (selectedPaymentMethod === 'qr' && !qrCodeGenerated) {
      setQrCodeGenerated(true);
      toast({
        title: '📱 QR-код сгенерирован',
        description: 'Отсканируйте код для оплаты',
      });
      return;
    }
    
    const updatedHistory = orderHistory.map(order => 
      order.id === selectedOrderForPayment.id 
        ? { ...order, isPaid: true, paymentMethod: selectedPaymentMethod }
        : order
    );
    
    setOrderHistory(updatedHistory);
    setPaymentDialogOpen(false);
    setQrCodeGenerated(false);
    
    const methodNames = {
      card: 'Картой',
      cash: 'Наличными',
      qr: 'QR-кодом'
    };
    
    toast({
      title: '✅ Оплата успешна!',
      description: `Оплачено ${methodNames[selectedPaymentMethod]} • ${selectedOrderForPayment.price}₽`,
    });
  };

  const startTrial = () => {
    const trialEnd = new Date();
    trialEnd.setDate(trialEnd.getDate() + 7);
    
    setDriverSubscription({
      status: 'trial',
      trialEndsAt: trialEnd,
      isTrialUsed: true
    });
    
    setSubscriptionDialogOpen(false);
    
    toast({
      title: '🎉 Пробный период активирован!',
      description: '7 дней за 1₽ • До ' + trialEnd.toLocaleDateString('ru-RU'),
    });
  };

  const activateSubscription = () => {
    const subscriptionEnd = new Date();
    subscriptionEnd.setMonth(subscriptionEnd.getMonth() + 1);
    
    setDriverSubscription({
      status: 'active',
      subscriptionEndsAt: subscriptionEnd,
      isTrialUsed: driverSubscription.isTrialUsed
    });
    
    setSubscriptionDialogOpen(false);
    
    toast({
      title: '✅ Подписка оформлена!',
      description: 'Активна до ' + subscriptionEnd.toLocaleDateString('ru-RU'),
    });
  };

  const getRemainingDays = () => {
    const targetDate = driverSubscription.status === 'trial' 
      ? driverSubscription.trialEndsAt 
      : driverSubscription.subscriptionEndsAt;
    
    if (!targetDate) return 0;
    
    const diff = targetDate.getTime() - new Date().getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  const copyReferralCode = () => {
    navigator.clipboard.writeText(referralCode);
    setCopiedCode(true);
    toast({
      title: '📋 Код скопирован!',
      description: 'Реферальный код скопирован в буфер обмена',
    });
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const shareReferralCode = () => {
    const message = `Присоединяйся к ЮGo и начни зарабатывать! Используй мой реферальный код: ${referralCode}\n\nПолучи 7 дней за 1₽!`;
    
    if (navigator.share) {
      navigator.share({
        title: 'ЮGo — реферальный код',
        text: message,
      });
    } else {
      copyReferralCode();
    }
  };

  const sendMessage = () => {
    if (!newMessage.trim()) return;
    
    const message: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: newMessage,
      time: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
    };
    
    setMessages([...messages, message]);
    setNewMessage('');
    
    setTimeout(() => {
      const driverResponse: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'driver',
        text: getDriverResponse(newMessage),
        time: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages(prev => [...prev, driverResponse]);
    }, 1500);
  };

  const getDriverResponse = (userMessage: string): string => {
    const lowerMsg = userMessage.toLowerCase();
    if (lowerMsg.includes('где') || lowerMsg.includes('когда')) {
      return 'Уже еду к вам, буду через 3-5 минут! 🚗';
    } else if (lowerMsg.includes('багаж') || lowerMsg.includes('чемодан')) {
      return 'Да, конечно! Багажник свободен 👍';
    } else if (lowerMsg.includes('подожд') || lowerMsg.includes('задерж')) {
      return 'Хорошо, подожду. Не торопитесь!';
    } else if (lowerMsg.includes('спасибо') || lowerMsg.includes('благодар')) {
      return 'Всегда пожалуйста! Хорошей поездки! 😊';
    } else {
      return 'Понял вас, спасибо за информацию! ✅';
    }
  };

  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [messages]);

  const menuItems = [
    { id: 'order', label: 'Заказ', icon: 'Car' },
    { id: 'history', label: 'История', icon: 'History' },
    { id: 'profile', label: 'Профиль', icon: 'User' },
    { id: 'referral', label: 'Рефералы', icon: 'Users' },
    { id: 'support', label: 'Поддержка', icon: 'MessageCircle' },
    { id: 'tariff', label: 'Тариф', icon: 'DollarSign' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-accent/5 to-secondary/10">
      <div className="max-w-lg mx-auto p-4 space-y-4">
        <div className="pt-6 pb-4 animate-fade-in">
          <h1 className="text-4xl font-bold text-center bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
            ЮGo
          </h1>
          <p className="text-center text-muted-foreground mt-2">
            Быстрое такси в один клик
          </p>
        </div>

        <div className="flex gap-2 justify-center animate-slide-up">
          <Button
            variant={role === 'passenger' ? 'default' : 'outline'}
            onClick={() => setRole('passenger')}
            className="flex-1"
          >
            <Icon name="User" className="mr-2" size={18} />
            Пассажир
          </Button>
          <Button
            variant={role === 'driver' ? 'default' : 'outline'}
            onClick={() => setRole('driver')}
            className="flex-1 bg-secondary hover:bg-secondary/90"
          >
            <Icon name="Car" className="mr-2" size={18} />
            Водитель
          </Button>
        </div>

        {role === 'passenger' && (
          <div className="space-y-4 animate-fade-in">
            <Card className="shadow-lg border-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Icon name="MapPin" className="text-primary" size={24} />
                  Новый заказ
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Icon name="Navigation" size={16} className="text-accent" />
                    Откуда
                  </label>
                  <Input
                    placeholder="Улица, дом"
                    value={from}
                    onChange={(e) => setFrom(e.target.value)}
                    className="border-2"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Icon name="MapPinned" size={16} className="text-secondary" />
                    Куда
                  </label>
                  <Input
                    placeholder="Улица, дом"
                    value={to}
                    onChange={(e) => setTo(e.target.value)}
                    className="border-2"
                  />
                </div>

                <div className="space-y-3">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Icon name="Plus" size={16} className="text-primary" />
                    Дополнительные опции
                  </label>
                  <div className="space-y-2">
                    {extraOptions.map((option) => (
                      <button
                        key={option.id}
                        onClick={() => toggleExtraOption(option.id)}
                        className={`w-full p-3 rounded-xl border-2 transition-all hover:scale-[1.02] flex items-center justify-between ${
                          selectedExtraOptions.includes(option.id)
                            ? 'border-primary bg-primary/10'
                            : 'border-border bg-background hover:border-primary/50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Icon
                            name={option.icon as any}
                            size={20}
                            className={selectedExtraOptions.includes(option.id) ? 'text-primary' : 'text-muted-foreground'}
                          />
                          <div className="text-left">
                            <p className={`text-sm font-semibold ${selectedExtraOptions.includes(option.id) ? 'text-primary' : 'text-foreground'}`}>
                              {option.name}
                            </p>
                          </div>
                        </div>
                        <Badge variant={selectedExtraOptions.includes(option.id) ? 'default' : 'outline'}>
                          {option.description}
                        </Badge>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="bg-muted/50 rounded-xl p-4 space-y-3">
                  <div className="flex items-start gap-2">
                    <Icon name="Clock" size={16} className="text-accent mt-0.5" />
                    <div className="flex-1 text-xs text-muted-foreground">
                      <p className="font-medium text-foreground mb-1">⏱️ Ожидание</p>
                      <p>Первые {FREE_WAITING_MINUTES} минуты бесплатно, далее +{WAITING_PRICE_PER_MINUTE}₽/мин</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Icon name="Route" size={16} className="text-secondary mt-0.5" />
                    <div className="flex-1 text-xs text-muted-foreground">
                      <p className="font-medium text-foreground mb-1">🛣️ Заезд</p>
                      <p>До {FREE_DETOUR_MINUTES} минут +{DETOUR_BASE_PRICE}₽, свыше +{DETOUR_PRICE_PER_MINUTE}₽/мин</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Icon name="MapPin" size={16} className="text-primary mt-0.5" />
                    <div className="flex-1 text-xs text-muted-foreground">
                      <p className="font-medium text-foreground mb-1">📍 Зона работы</p>
                      <p>г. Нижнеудинск и Нижнеудинский район</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Icon name="Gauge" size={16} className="text-accent mt-0.5" />
                    <div className="flex-1 text-xs text-muted-foreground">
                      <p className="font-medium text-foreground mb-1">💰 Стоимость</p>
                      <p>{PRICE_PER_KM}₽ за километр</p>
                    </div>
                  </div>
                </div>

                {from && to && (
                  <Button
                    onClick={calculateEstimate}
                    variant="outline"
                    className="w-full border-2"
                  >
                    <Icon name="Calculator" className="mr-2" size={18} />
                    Рассчитать стоимость
                  </Button>
                )}

                {estimatedPrice && (
                  <div className="bg-accent/10 border-2 border-accent/30 rounded-xl p-4 animate-slide-up">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Icon name="Wallet" className="text-accent" size={20} />
                        <span className="text-sm font-medium">Примерная стоимость</span>
                      </div>
                      <span className="text-2xl font-bold text-accent">{estimatedPrice}₽</span>
                    </div>
                  </div>
                )}

                <Button
                  onClick={handleCreateOrder}
                  className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity text-lg py-6"
                  disabled={currentOrder?.status === 'searching'}
                >
                  {currentOrder?.status === 'searching' ? (
                    <>
                      <Icon name="Loader2" className="mr-2 animate-spin" size={20} />
                      Поиск водителя...
                    </>
                  ) : (
                    <>
                      <Icon name="Search" className="mr-2" size={20} />
                      Найти такси
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {currentOrder && currentOrder.status === 'found' && (
              <Card className="shadow-lg border-2 border-primary/50 bg-gradient-to-br from-primary/5 to-accent/5 animate-slide-up">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-primary">
                    <Icon name="CheckCircle2" size={24} />
                    Водитель найден!
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                        <Icon name="User" size={24} className="text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold text-lg">{currentOrder.driverName}</p>
                        <div className="flex items-center gap-1">
                          <Icon name="Star" size={14} className="text-yellow-500 fill-yellow-500" />
                          <span className="text-sm font-medium">{currentOrder.driverRating}</span>
                          <span className="text-xs text-muted-foreground ml-1">• {currentOrder.carNumber}</span>
                        </div>
                      </div>
                    </div>
                    <Badge className="bg-accent text-white px-4 py-2 text-base">
                      {currentOrder.arrivalTime} мин
                    </Badge>
                  </div>
                  <div className="pt-2 space-y-2 text-sm">
                    <div className="flex items-start gap-2">
                      <Icon name="Navigation" size={16} className="text-accent mt-0.5" />
                      <p className="text-muted-foreground">{currentOrder.from}</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <Icon name="MapPinned" size={16} className="text-secondary mt-0.5" />
                      <p className="text-muted-foreground">{currentOrder.to}</p>
                    </div>
                  </div>
                  <div className="pt-3 mt-3 border-t space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">{currentOrder.distance} км × {PRICE_PER_KM}₽</span>
                      <span className="text-sm font-medium">{currentOrder.distance! * PRICE_PER_KM}₽</span>
                    </div>
                    {currentOrder.extraOptions && currentOrder.extraOptions.length > 0 && (
                      currentOrder.extraOptions.map(optionId => {
                        const option = extraOptions.find(e => e.id === optionId);
                        return option ? (
                          <div key={optionId} className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">{option.name}</span>
                            <span className="text-sm font-medium">+{option.price}₽</span>
                          </div>
                        ) : null;
                      })
                    )}
                    {currentOrder.waitingMinutes && currentOrder.waitingMinutes > FREE_WAITING_MINUTES && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Ожидание ({currentOrder.waitingMinutes - FREE_WAITING_MINUTES} мин)</span>
                        <span className="text-sm font-medium">+{(currentOrder.waitingMinutes - FREE_WAITING_MINUTES) * WAITING_PRICE_PER_MINUTE}₽</span>
                      </div>
                    )}
                    {currentOrder.detourMinutes && currentOrder.detourMinutes > 0 && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">
                          Заезд ({currentOrder.detourMinutes} мин)
                        </span>
                        <span className="text-sm font-medium">
                          +{currentOrder.detourMinutes <= FREE_DETOUR_MINUTES 
                            ? DETOUR_BASE_PRICE 
                            : DETOUR_BASE_PRICE + (currentOrder.detourMinutes - FREE_DETOUR_MINUTES) * DETOUR_PRICE_PER_MINUTE}₽
                        </span>
                      </div>
                    )}
                    <div className="flex items-center justify-between pt-2 border-t">
                      <span className="text-lg font-semibold">Итого</span>
                      <p className="text-2xl font-bold text-primary">{currentOrder.price}₽</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {currentOrder && currentOrder.status === 'found' && currentOrder.driverLocation && (
              <Card className="shadow-lg border-2 border-accent/50 bg-gradient-to-br from-accent/5 to-primary/5 animate-slide-up">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-accent">
                    <Icon name="MapPin" size={24} />
                    Отслеживание такси
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="relative w-full h-64 bg-muted rounded-xl overflow-hidden border-2">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-100 to-green-100">
                      <svg className="w-full h-full">
                        <defs>
                          <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                            <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(0,0,0,0.05)" strokeWidth="0.5"/>
                          </pattern>
                        </defs>
                        <rect width="100%" height="100%" fill="url(#grid)" />
                        
                        {userLocation && (
                          <circle
                            cx="50%"
                            cy="50%"
                            r="8"
                            fill="#0EA5E9"
                            className="animate-pulse"
                          />
                        )}
                        
                        {currentOrder.driverLocation && userLocation && (
                          <>
                            <circle
                              cx={`${50 + (currentOrder.driverLocation.lng - userLocation.lng) * 2000}%`}
                              cy={`${50 + (currentOrder.driverLocation.lat - userLocation.lat) * 2000}%`}
                              r="10"
                              fill="#F97316"
                              className="animate-pulse"
                            />
                            <line
                              x1="50%"
                              y1="50%"
                              x2={`${50 + (currentOrder.driverLocation.lng - userLocation.lng) * 2000}%`}
                              y2={`${50 + (currentOrder.driverLocation.lat - userLocation.lat) * 2000}%`}
                              stroke="#8B5CF6"
                              strokeWidth="2"
                              strokeDasharray="5,5"
                              className="animate-pulse"
                            />
                          </>
                        )}
                      </svg>
                      
                      <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm rounded-lg px-3 py-2 shadow-lg">
                        <div className="flex items-center gap-2 text-sm">
                          <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                          <span className="font-medium">Вы</span>
                        </div>
                      </div>
                      
                      <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm rounded-lg px-3 py-2 shadow-lg">
                        <div className="flex items-center gap-2 text-sm">
                          <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                          <span className="font-medium">Водитель</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between bg-accent/10 rounded-lg p-3">
                    <div className="flex items-center gap-2">
                      <Icon name="Navigation2" size={20} className="text-accent" />
                      <span className="text-sm font-medium">Водитель едет к вам</span>
                    </div>
                    <Badge className="bg-accent text-white">
                      <Icon name="Clock" size={14} className="mr-1" />
                      {currentOrder.arrivalTime} мин
                    </Badge>
                  </div>

                  {userLocation && (
                    <div className="text-xs text-muted-foreground space-y-1">
                      <div className="flex items-center gap-2">
                        <Icon name="MapPin" size={12} />
                        <span>Ваши координаты: {userLocation.lat.toFixed(4)}, {userLocation.lng.toFixed(4)}</span>
                      </div>
                      {currentOrder.driverLocation && (
                        <div className="flex items-center gap-2">
                          <Icon name="Car" size={12} />
                          <span>Водитель: {currentOrder.driverLocation.lat.toFixed(4)}, {currentOrder.driverLocation.lng.toFixed(4)}</span>
                        </div>
                      )}
                    </div>
                  )}

                  <Button
                    onClick={() => setChatOpen(true)}
                    className="w-full bg-gradient-to-r from-primary to-accent"
                  >
                    <Icon name="MessageCircle" className="mr-2" size={18} />
                    Написать водителю
                  </Button>
                </CardContent>
              </Card>
            )}

            {activeSection === 'history' && (
              <Card className="shadow-lg border-2 border-primary/30 animate-slide-up">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-primary">
                    <Icon name="History" size={24} />
                    История поездок
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {orderHistory.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Icon name="FileText" size={48} className="mx-auto mb-2 opacity-50" />
                      <p>Пока нет завершённых поездок</p>
                    </div>
                  ) : (
                    orderHistory.map((order) => (
                      <Card key={order.id} className="bg-gradient-to-br from-primary/5 to-accent/5">
                        <CardContent className="pt-4 space-y-3">
                          <div className="flex items-start justify-between">
                            <div className="space-y-1 flex-1">
                              <div className="flex items-center gap-2">
                                <Icon name="Calendar" size={14} className="text-muted-foreground" />
                                <span className="text-xs text-muted-foreground">{order.date}</span>
                                <Icon name="Clock" size={14} className="text-muted-foreground" />
                                <span className="text-xs text-muted-foreground">{order.time}</span>
                              </div>
                              <div className="space-y-1.5 mt-2">
                                <div className="flex items-start gap-2">
                                  <Icon name="Navigation" size={14} className="text-accent mt-0.5" />
                                  <p className="text-sm font-medium">{order.from}</p>
                                </div>
                                <div className="flex items-start gap-2">
                                  <Icon name="MapPinned" size={14} className="text-secondary mt-0.5" />
                                  <p className="text-sm font-medium">{order.to}</p>
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center justify-between pt-2 border-t">
                            <span className="text-xs text-muted-foreground">{order.distance} км × {PRICE_PER_KM}₽</span>
                            <span className="text-lg font-bold text-primary">{order.price}₽</span>
                          </div>
                          {order.driverName && (
                            <div className="flex items-center justify-between text-xs">
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <Icon name="User" size={14} />
                                <span>{order.driverName}</span>
                                {order.carNumber && <span>• {order.carNumber}</span>}
                                {order.driverRating && (
                                  <div className="flex items-center gap-1">
                                    <Icon name="Star" size={12} className="text-yellow-500 fill-yellow-500" />
                                    <span>{order.driverRating}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                          <div className="pt-2 border-t space-y-2">
                            {order.isPaid ? (
                              <div className="flex items-center justify-between bg-green-500/10 border border-green-500/30 rounded-lg p-2">
                                <div className="flex items-center gap-2">
                                  <Icon name="CheckCircle2" size={16} className="text-green-600" />
                                  <span className="text-xs font-medium text-green-600">Оплачено</span>
                                  {order.paymentMethod === 'card' && <span className="text-xs text-muted-foreground">• Картой</span>}
                                  {order.paymentMethod === 'cash' && <span className="text-xs text-muted-foreground">• Наличными</span>}
                                  {order.paymentMethod === 'qr' && <span className="text-xs text-muted-foreground">• QR-кодом</span>}
                                </div>
                                <Icon name="Wallet" size={16} className="text-green-600" />
                              </div>
                            ) : (
                              <Button
                                onClick={() => openPaymentDialog(order)}
                                className="w-full bg-gradient-to-r from-green-600 to-green-500"
                                size="sm"
                              >
                                <Icon name="CreditCard" className="mr-2" size={14} />
                                Оплатить {order.price}₽
                              </Button>
                            )}
                            
                            {order.rating ? (
                              <div>
                                <div className="flex items-center gap-1 mb-1">
                                  {[1, 2, 3, 4, 5].map((star) => (
                                    <Icon
                                      key={star}
                                      name="Star"
                                      size={16}
                                      className={star <= order.rating! ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'}
                                    />
                                  ))}
                                </div>
                                {order.review && (
                                  <p className="text-xs text-muted-foreground italic">{order.review}</p>
                                )}
                              </div>
                            ) : (
                              <Button
                                onClick={() => openRatingDialog(order)}
                                variant="outline"
                                size="sm"
                                className="w-full"
                              >
                                <Icon name="Star" className="mr-2" size={14} />
                                Оценить поездку
                              </Button>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </CardContent>
              </Card>
            )}

            {activeSection === 'profile' && (
              <Card className="shadow-lg border-2 border-primary/30 animate-slide-up">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-primary">
                    <Icon name="User" size={24} />
                    Мой профиль
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white text-2xl font-bold">
                      А
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold">Алексей Иванов</h3>
                      <p className="text-sm text-muted-foreground">+7 (999) 123-45-67</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge className="bg-gradient-to-r from-primary to-accent">
                          <Icon name="Award" size={14} className="mr-1" />
                          Уровень {stats.level}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-primary/10 to-accent/10 rounded-xl p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Прогресс до уровня {stats.level + 1}</span>
                      <span className="text-xs text-muted-foreground">{stats.tripsToNextLevel} поездок осталось</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-primary to-accent h-2 rounded-full transition-all"
                        style={{ width: `${((5 - stats.tripsToNextLevel) / 5) * 100}%` }}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <Card className="bg-gradient-to-br from-primary/5 to-primary/10">
                      <CardContent className="pt-4 text-center">
                        <Icon name="MapPin" size={32} className="mx-auto mb-2 text-primary" />
                        <p className="text-2xl font-bold text-primary">{stats.totalTrips}</p>
                        <p className="text-xs text-muted-foreground">Поездок</p>
                      </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-accent/5 to-accent/10">
                      <CardContent className="pt-4 text-center">
                        <Icon name="Navigation" size={32} className="mx-auto mb-2 text-accent" />
                        <p className="text-2xl font-bold text-accent">{stats.totalDistance}</p>
                        <p className="text-xs text-muted-foreground">Километров</p>
                      </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-secondary/5 to-secondary/10">
                      <CardContent className="pt-4 text-center">
                        <Icon name="Wallet" size={32} className="mx-auto mb-2 text-secondary" />
                        <p className="text-2xl font-bold text-secondary">{stats.totalSpent}₽</p>
                        <p className="text-xs text-muted-foreground">Потрачено</p>
                      </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-yellow-500/5 to-yellow-500/10">
                      <CardContent className="pt-4 text-center">
                        <Icon name="Star" size={32} className="mx-auto mb-2 text-yellow-500" />
                        <p className="text-2xl font-bold text-yellow-500">{stats.averageRating}</p>
                        <p className="text-xs text-muted-foreground">Средний рейтинг</p>
                      </CardContent>
                    </Card>
                  </div>

                  <Card className="bg-gradient-to-r from-primary/20 via-accent/20 to-secondary/20 border-2 border-primary">
                    <CardContent className="pt-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Icon name="Gift" size={24} className="text-primary" />
                          <div>
                            <p className="font-semibold">Бонусные баллы</p>
                            <p className="text-xs text-muted-foreground">1 балл = 1₽ скидки</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                            {stats.bonusPoints}
                          </p>
                          <p className="text-xs text-muted-foreground">баллов</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <div className="space-y-2">
                    <h4 className="font-semibold flex items-center gap-2">
                      <Icon name="Trophy" size={18} className="text-primary" />
                      Достижения
                    </h4>
                    <div className="grid grid-cols-3 gap-2">
                      <div className={`p-3 rounded-lg text-center ${stats.totalTrips >= 1 ? 'bg-primary/20 border-2 border-primary' : 'bg-muted/50 opacity-50'}`}>
                        <Icon name="Medal" size={24} className={`mx-auto ${stats.totalTrips >= 1 ? 'text-primary' : 'text-muted-foreground'}`} />
                        <p className="text-xs mt-1 font-medium">Первая поездка</p>
                      </div>
                      <div className={`p-3 rounded-lg text-center ${stats.totalTrips >= 10 ? 'bg-accent/20 border-2 border-accent' : 'bg-muted/50 opacity-50'}`}>
                        <Icon name="Flame" size={24} className={`mx-auto ${stats.totalTrips >= 10 ? 'text-accent' : 'text-muted-foreground'}`} />
                        <p className="text-xs mt-1 font-medium">10 поездок</p>
                      </div>
                      <div className={`p-3 rounded-lg text-center ${stats.totalDistance >= 100 ? 'bg-secondary/20 border-2 border-secondary' : 'bg-muted/50 opacity-50'}`}>
                        <Icon name="Target" size={24} className={`mx-auto ${stats.totalDistance >= 100 ? 'text-secondary' : 'text-muted-foreground'}`} />
                        <p className="text-xs mt-1 font-medium">100+ км</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="text-lg">Меню</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-3">
                  {menuItems.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => setActiveSection(item.id)}
                      className={`flex flex-col items-center gap-2 p-4 rounded-xl transition-all hover:scale-105 ${
                        activeSection === item.id
                          ? 'bg-gradient-to-br from-primary/20 to-accent/20 border-2 border-primary'
                          : 'bg-muted/50 hover:bg-muted'
                      }`}
                    >
                      <Icon
                        name={item.icon as any}
                        size={24}
                        className={activeSection === item.id ? 'text-primary' : 'text-muted-foreground'}
                      />
                      <span className="text-xs font-medium text-center">{item.label}</span>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <Dialog open={chatOpen} onOpenChange={setChatOpen}>
          <DialogContent className="max-w-md h-[600px] flex flex-col p-0">
            <DialogHeader className="p-4 border-b">
              <DialogTitle className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                  <Icon name="User" size={20} className="text-primary" />
                </div>
                <div>
                  <p className="font-semibold">{currentOrder?.driverName || 'Водитель'}</p>
                  <p className="text-xs text-muted-foreground">{currentOrder?.carNumber}</p>
                </div>
              </DialogTitle>
            </DialogHeader>
            
            <div className="flex-1 overflow-hidden">
              <div 
                ref={chatScrollRef}
                className="h-full overflow-y-auto p-4 space-y-3"
              >
                {messages.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Icon name="MessageCircle" size={48} className="mx-auto mb-2 opacity-50" />
                    <p>Начните диалог с водителем</p>
                  </div>
                ) : (
                  messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[75%] rounded-2xl px-4 py-2 ${
                          msg.sender === 'user'
                            ? 'bg-gradient-to-r from-primary to-accent text-white'
                            : 'bg-muted'
                        }`}
                      >
                        <p className="text-sm">{msg.text}</p>
                        <p className={`text-xs mt-1 ${msg.sender === 'user' ? 'text-white/70' : 'text-muted-foreground'}`}>
                          {msg.time}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="p-4 border-t bg-background">
              <div className="flex gap-2">
                <Input
                  placeholder="Напишите сообщение..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                  className="flex-1"
                />
                <Button
                  onClick={sendMessage}
                  disabled={!newMessage.trim()}
                  className="bg-gradient-to-r from-primary to-accent"
                >
                  <Icon name="Send" size={18} />
                </Button>
              </div>
              <div className="flex gap-2 mt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setNewMessage('Где вы сейчас?')}
                  className="flex-1 text-xs"
                >
                  📍 Где вы?
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setNewMessage('У меня багаж')}
                  className="flex-1 text-xs"
                >
                  🧳 Багаж
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setNewMessage('Подождите минуту')}
                  className="flex-1 text-xs"
                >
                  ⏱️ Подождите
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={ratingDialogOpen} onOpenChange={setRatingDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Icon name="Star" size={24} className="text-yellow-500" />
                Оценить поездку
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              {selectedOrderForRating && (
                <>
                  <div className="space-y-2">
                    <div className="text-sm text-muted-foreground">
                      <div className="flex items-center gap-2 mb-1">
                        <Icon name="Navigation" size={14} />
                        <span>{selectedOrderForRating.from}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Icon name="MapPinned" size={14} />
                        <span>{selectedOrderForRating.to}</span>
                      </div>
                    </div>
                    <div className="text-sm font-medium">
                      Водитель: {selectedOrderForRating.driverName} • {selectedOrderForRating.carNumber}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Ваша оценка</label>
                    <div className="flex gap-2 justify-center">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          onClick={() => setTempRating(star)}
                          className="transition-transform hover:scale-110"
                        >
                          <Icon
                            name="Star"
                            size={40}
                            className={star <= tempRating ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'}
                          />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Комментарий (необязательно)</label>
                    <Textarea
                      placeholder="Поделитесь впечатлениями о поездке..."
                      value={tempReview}
                      onChange={(e) => setTempReview(e.target.value)}
                      rows={3}
                    />
                  </div>

                  <Button
                    onClick={submitRating}
                    disabled={tempRating === 0}
                    className="w-full"
                  >
                    <Icon name="Send" className="mr-2" size={18} />
                    Отправить отзыв
                  </Button>
                </>
              )}
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Icon name="CreditCard" size={24} className="text-primary" />
                Оплата поездки
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              {selectedOrderForPayment && (
                <>
                  <div className="bg-gradient-to-r from-primary/10 to-accent/10 rounded-xl p-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">Сумма к оплате</p>
                        <p className="text-3xl font-bold text-primary">{selectedOrderForPayment.price}₽</p>
                        <div className="text-xs text-muted-foreground">
                          {selectedOrderForPayment.distance} км × {PRICE_PER_KM}₽
                        </div>
                      </div>
                      <Icon name="Wallet" size={48} className="text-primary/30" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Способ оплаты</label>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        onClick={() => setSelectedPaymentMethod('card')}
                        className={`p-4 rounded-xl border-2 transition-all hover:scale-105 ${
                          selectedPaymentMethod === 'card'
                            ? 'border-primary bg-primary/10'
                            : 'border-border bg-background hover:border-primary/50'
                        }`}
                      >
                        <Icon
                          name="CreditCard"
                          size={28}
                          className={selectedPaymentMethod === 'card' ? 'text-primary mx-auto' : 'text-muted-foreground mx-auto'}
                        />
                        <p className={`text-xs font-semibold mt-2 ${selectedPaymentMethod === 'card' ? 'text-primary' : 'text-foreground'}`}>
                          Карта
                        </p>
                      </button>

                      <button
                        onClick={() => setSelectedPaymentMethod('cash')}
                        className={`p-4 rounded-xl border-2 transition-all hover:scale-105 ${
                          selectedPaymentMethod === 'cash'
                            ? 'border-secondary bg-secondary/10'
                            : 'border-border bg-background hover:border-secondary/50'
                        }`}
                      >
                        <Icon
                          name="Banknote"
                          size={28}
                          className={selectedPaymentMethod === 'cash' ? 'text-secondary mx-auto' : 'text-muted-foreground mx-auto'}
                        />
                        <p className={`text-xs font-semibold mt-2 ${selectedPaymentMethod === 'cash' ? 'text-secondary' : 'text-foreground'}`}>
                          Наличные
                        </p>
                      </button>

                      <button
                        onClick={() => setSelectedPaymentMethod('qr')}
                        className={`p-4 rounded-xl border-2 transition-all hover:scale-105 ${
                          selectedPaymentMethod === 'qr'
                            ? 'border-accent bg-accent/10'
                            : 'border-border bg-background hover:border-accent/50'
                        }`}
                      >
                        <Icon
                          name="QrCode"
                          size={28}
                          className={selectedPaymentMethod === 'qr' ? 'text-accent mx-auto' : 'text-muted-foreground mx-auto'}
                        />
                        <p className={`text-xs font-semibold mt-2 ${selectedPaymentMethod === 'qr' ? 'text-accent' : 'text-foreground'}`}>
                          QR-код
                        </p>
                      </button>
                    </div>
                  </div>

                  {selectedPaymentMethod === 'qr' && qrCodeGenerated && (
                    <div className="bg-white rounded-xl p-6 border-2 border-accent animate-fade-in">
                      <div className="space-y-3">
                        <div className="w-full aspect-square bg-gradient-to-br from-accent/20 to-primary/20 rounded-lg flex items-center justify-center">
                          <div className="grid grid-cols-8 gap-1 p-4">
                            {Array.from({ length: 64 }).map((_, i) => (
                              <div
                                key={i}
                                className={`w-3 h-3 rounded-sm ${
                                  Math.random() > 0.5 ? 'bg-foreground' : 'bg-transparent'
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                        <div className="text-center space-y-1">
                          <p className="text-sm font-medium">Отсканируйте для оплаты</p>
                          <p className="text-xs text-muted-foreground">QR-код действителен 10 минут</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {selectedPaymentMethod === 'card' && (
                    <div className="space-y-2 animate-fade-in">
                      <label className="text-xs font-medium text-muted-foreground">Номер карты</label>
                      <Input
                        placeholder="1234 5678 9012 3456"
                        className="text-center tracking-wider"
                      />
                    </div>
                  )}

                  {selectedPaymentMethod === 'cash' && (
                    <div className="bg-muted/50 rounded-xl p-4 animate-fade-in">
                      <div className="flex items-start gap-3">
                        <Icon name="Info" size={20} className="text-secondary mt-0.5" />
                        <div className="space-y-1">
                          <p className="text-sm font-medium">Оплата наличными</p>
                          <p className="text-xs text-muted-foreground">
                            Передайте оплату водителю в конце поездки. Подтвердите для фиксации способа оплаты.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  <Button
                    onClick={processPayment}
                    className="w-full bg-gradient-to-r from-primary to-accent text-lg py-6"
                  >
                    {selectedPaymentMethod === 'qr' && !qrCodeGenerated ? (
                      <>
                        <Icon name="QrCode" className="mr-2" size={20} />
                        Сгенерировать QR-код
                      </>
                    ) : selectedPaymentMethod === 'cash' ? (
                      <>
                        <Icon name="Check" className="mr-2" size={20} />
                        Подтвердить
                      </>
                    ) : (
                      <>
                        <Icon name="CreditCard" className="mr-2" size={20} />
                        Оплатить {selectedOrderForPayment.price}₽
                      </>
                    )}
                  </Button>
                </>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {role === 'driver' && (
          <div className="space-y-4 animate-fade-in">
            {(driverSubscription.status === 'trial' || driverSubscription.status === 'active') && (
              <Card className="shadow-lg border-2 border-accent bg-gradient-to-r from-accent/5 to-secondary/5">
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-accent to-secondary flex items-center justify-center">
                        <Icon name="Crown" size={24} className="text-white" />
                      </div>
                      <div>
                        <p className="text-sm font-bold">
                          {driverSubscription.status === 'trial' ? '🎉 Пробный период' : '✅ Подписка активна'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Осталось {getRemainingDays()} дней
                        </p>
                      </div>
                    </div>
                    <Button
                      onClick={() => setSubscriptionDialogOpen(true)}
                      variant="outline"
                      size="sm"
                      className="border-accent text-accent hover:bg-accent hover:text-white"
                    >
                      <Icon name="Settings" size={16} className="mr-1" />
                      Управление
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            <Card className="shadow-lg border-2 border-accent">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 ${
                      isDriverWorking 
                        ? 'bg-gradient-to-br from-green-500 to-green-600 shadow-lg shadow-green-500/50' 
                        : 'bg-gray-300'
                    }`}>
                      <Icon name={isDriverWorking ? "Radio" : "PowerOff"} size={28} className="text-white" />
                    </div>
                    <div>
                      <p className={`text-lg font-bold ${isDriverWorking ? 'text-green-600' : 'text-gray-500'}`}>
                        {isDriverWorking ? '🟢 В сети' : '⚪ Не в сети'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {isDriverWorking ? 'Вы получаете заказы' : 'Заказы не поступают'}
                      </p>
                    </div>
                  </div>
                  <Button
                    onClick={toggleDriverWork}
                    size="lg"
                    className={`transition-all duration-300 ${
                      isDriverWorking
                        ? 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700'
                        : 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700'
                    }`}
                  >
                    <Icon name={isDriverWorking ? "Pause" : "Play"} className="mr-2" size={20} />
                    {isDriverWorking ? 'Остановить' : 'Работаю'}
                  </Button>
                </div>
              </CardContent>
            </Card>
            
            <Card className="shadow-lg border-2 border-secondary">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-secondary">
                  <Icon name="Bell" size={24} />
                  Входящие заказы
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {incomingOrders.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Icon name="Inbox" size={48} className="mx-auto mb-2 opacity-50" />
                    <p>Пока нет новых заказов</p>
                  </div>
                ) : (
                  incomingOrders.map((order) => (
                    <Card key={order.id} className="bg-gradient-to-br from-secondary/5 to-accent/5">
                      <CardContent className="pt-6 space-y-3">
                        <div className="space-y-2">
                          <div className="flex items-start gap-2">
                            <Icon name="Navigation" size={16} className="text-accent mt-1" />
                            <div>
                              <p className="text-xs text-muted-foreground">Откуда</p>
                              <p className="font-medium">{order.from}</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-2">
                            <Icon name="MapPinned" size={16} className="text-secondary mt-1" />
                            <div>
                              <p className="text-xs text-muted-foreground">Куда</p>
                              <p className="font-medium">{order.to}</p>
                            </div>
                          </div>
                        </div>
                        <div className="bg-accent/10 p-3 rounded-lg space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-muted-foreground">{order.distance} км × {PRICE_PER_KM}₽</span>
                            <span className="text-sm font-medium">{order.distance! * PRICE_PER_KM}₽</span>
                          </div>
                          {order.extraOptions && order.extraOptions.length > 0 && (
                            order.extraOptions.map(optionId => {
                              const option = extraOptions.find(e => e.id === optionId);
                              return option ? (
                                <div key={optionId} className="flex items-center justify-between">
                                  <span className="text-xs text-muted-foreground">{option.name}</span>
                                  <span className="text-xs font-medium">+{option.price}₽</span>
                                </div>
                              ) : null;
                            })
                          )}
                          <div className="flex items-center justify-between pt-1 border-t border-accent/20">
                            <span className="text-sm font-semibold">Итого</span>
                            <span className="text-lg font-bold text-accent">{order.price}₽</span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            onClick={() => handleAcceptOrder(order.id)}
                            className="flex-1 bg-gradient-to-r from-secondary to-accent"
                          >
                            <Icon name="Check" className="mr-2" size={18} />
                            Принять
                          </Button>
                          <Button
                            onClick={() => handleRejectOrder(order.id)}
                            variant="outline"
                            className="flex-1"
                          >
                            <Icon name="X" className="mr-2" size={18} />
                            Отказаться
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </CardContent>
            </Card>

            {activeSection === 'history' && (
              <Card className="shadow-lg border-2 border-secondary/30 animate-slide-up">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-secondary">
                    <Icon name="History" size={24} />
                    История заказов
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {orderHistory.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Icon name="FileText" size={48} className="mx-auto mb-2 opacity-50" />
                      <p>Пока нет завершённых заказов</p>
                    </div>
                  ) : (
                    orderHistory.map((order) => (
                      <Card key={order.id} className="bg-gradient-to-br from-secondary/5 to-accent/5">
                        <CardContent className="pt-4 space-y-3">
                          <div className="flex items-start justify-between">
                            <div className="space-y-1 flex-1">
                              <div className="flex items-center gap-2">
                                <Icon name="Calendar" size={14} className="text-muted-foreground" />
                                <span className="text-xs text-muted-foreground">{order.date}</span>
                                <Icon name="Clock" size={14} className="text-muted-foreground" />
                                <span className="text-xs text-muted-foreground">{order.time}</span>
                              </div>
                              <div className="space-y-1.5 mt-2">
                                <div className="flex items-start gap-2">
                                  <Icon name="Navigation" size={14} className="text-accent mt-0.5" />
                                  <p className="text-sm font-medium">{order.from}</p>
                                </div>
                                <div className="flex items-start gap-2">
                                  <Icon name="MapPinned" size={14} className="text-secondary mt-0.5" />
                                  <p className="text-sm font-medium">{order.to}</p>
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center justify-between pt-2 border-t">
                            <span className="text-xs text-muted-foreground">{order.distance} км × {PRICE_PER_KM}₽</span>
                            <span className="text-lg font-bold text-secondary">{order.price}₽</span>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </CardContent>
              </Card>
            )}

            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="text-lg">Меню водителя</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-3">
                  {menuItems.slice(1).map((item) => (
                    <button
                      key={item.id}
                      onClick={() => {
                        if (item.id === 'profile') {
                          setSubscriptionDialogOpen(true);
                        } else if (item.id === 'referral') {
                          setReferralDialogOpen(true);
                        } else {
                          setActiveSection(item.id);
                        }
                      }}
                      className={`flex flex-col items-center gap-2 p-4 rounded-xl transition-all hover:scale-105 ${
                        activeSection === item.id
                          ? 'bg-gradient-to-br from-secondary/20 to-accent/20 border-2 border-secondary'
                          : 'bg-muted/50 hover:bg-muted'
                      }`}
                    >
                      <Icon
                        name={item.icon as any}
                        size={24}
                        className={activeSection === item.id ? 'text-secondary' : 'text-muted-foreground'}
                      />
                      <span className="text-xs font-medium text-center">{item.label}</span>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <Dialog open={subscriptionDialogOpen} onOpenChange={setSubscriptionDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Icon name="Crown" size={24} className="text-accent" />
                Подписка ЮGo для водителей
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              {driverSubscription.status === 'none' && (
                <>
                  <div className="bg-gradient-to-br from-accent/10 to-secondary/10 rounded-xl p-6 text-center space-y-2">
                    <Icon name="Sparkles" size={48} className="mx-auto text-accent" />
                    <h3 className="text-2xl font-bold">Начните работать с ЮGo</h3>
                    <p className="text-sm text-muted-foreground">
                      Получайте заказы и зарабатывайте вместе с нами
                    </p>
                  </div>

                  <Card className="border-2 border-accent bg-gradient-to-br from-accent/5 to-transparent">
                    <CardContent className="pt-6 space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-bold text-lg">🎉 Пробный период</h4>
                          <p className="text-xs text-muted-foreground">7 дней доступа</p>
                        </div>
                        <div className="text-right">
                          <p className="text-3xl font-bold text-accent">1₽</p>
                          <p className="text-xs text-muted-foreground">на 7 дней</p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                          <Icon name="Check" size={16} className="text-green-600" />
                          <span>Неограниченное количество заказов</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Icon name="Check" size={16} className="text-green-600" />
                          <span>Приоритетная поддержка</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Icon name="Check" size={16} className="text-green-600" />
                          <span>Доступ ко всем функциям</span>
                        </div>
                      </div>
                      <Button
                        onClick={startTrial}
                        className="w-full bg-gradient-to-r from-accent to-secondary text-lg py-6"
                      >
                        <Icon name="Zap" className="mr-2" size={20} />
                        Начать за 1₽
                      </Button>
                    </CardContent>
                  </Card>

                  <Card className="border-2">
                    <CardContent className="pt-6 space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-bold text-lg">💪 Полная подписка</h4>
                          <p className="text-xs text-muted-foreground">Ежемесячное продление</p>
                        </div>
                        <div className="text-right">
                          <p className="text-3xl font-bold text-primary">1000₽</p>
                          <p className="text-xs text-muted-foreground">в месяц</p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                          <Icon name="Check" size={16} className="text-green-600" />
                          <span>Все преимущества пробного периода</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Icon name="Check" size={16} className="text-green-600" />
                          <span>Без комиссий с заказов</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Icon name="Check" size={16} className="text-green-600" />
                          <span>Бонусные баллы</span>
                        </div>
                      </div>
                      <Button
                        onClick={activateSubscription}
                        variant="outline"
                        className="w-full text-lg py-6"
                      >
                        <Icon name="CreditCard" className="mr-2" size={20} />
                        Оформить за 1000₽
                      </Button>
                    </CardContent>
                  </Card>
                </>
              )}

              {driverSubscription.status === 'trial' && (
                <>
                  <div className="bg-gradient-to-br from-accent/10 to-secondary/10 rounded-xl p-6 text-center space-y-2">
                    <Icon name="Clock" size={48} className="mx-auto text-accent" />
                    <h3 className="text-2xl font-bold">🎉 Пробный период</h3>
                    <p className="text-lg font-bold text-accent">Осталось {getRemainingDays()} дней</p>
                    <p className="text-xs text-muted-foreground">
                      Активно до {driverSubscription.trialEndsAt?.toLocaleDateString('ru-RU')}
                    </p>
                  </div>

                  <Card className="border-2 border-primary">
                    <CardContent className="pt-6 space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-bold text-lg">🚀 Перейти на полную подписку</h4>
                          <p className="text-xs text-muted-foreground">Продолжайте работать без ограничений</p>
                        </div>
                        <div className="text-right">
                          <p className="text-3xl font-bold text-primary">1000₽</p>
                          <p className="text-xs text-muted-foreground">в месяц</p>
                        </div>
                      </div>
                      <Button
                        onClick={activateSubscription}
                        className="w-full bg-gradient-to-r from-primary to-accent text-lg py-6"
                      >
                        <Icon name="Crown" className="mr-2" size={20} />
                        Оформить подписку
                      </Button>
                    </CardContent>
                  </Card>
                </>
              )}

              {driverSubscription.status === 'active' && (
                <>
                  <div className="bg-gradient-to-br from-green-500/10 to-green-600/10 rounded-xl p-6 text-center space-y-2">
                    <Icon name="CheckCircle2" size={48} className="mx-auto text-green-600" />
                    <h3 className="text-2xl font-bold">✅ Подписка активна</h3>
                    <p className="text-lg font-bold text-green-600">Осталось {getRemainingDays()} дней</p>
                    <p className="text-xs text-muted-foreground">
                      Автопродление {driverSubscription.subscriptionEndsAt?.toLocaleDateString('ru-RU')}
                    </p>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Icon name="CreditCard" size={20} className="text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">Стоимость</p>
                          <p className="text-xs text-muted-foreground">1000₽ в месяц</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Icon name="Calendar" size={20} className="text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">Следующий платёж</p>
                          <p className="text-xs text-muted-foreground">
                            {driverSubscription.subscriptionEndsAt?.toLocaleDateString('ru-RU')}
                          </p>
                        </div>
                      </div>
                    </div>

                    <Button
                      variant="outline"
                      className="w-full text-red-600 border-red-600 hover:bg-red-600 hover:text-white"
                    >
                      <Icon name="XCircle" className="mr-2" size={16} />
                      Отменить подписку
                    </Button>
                  </div>
                </>
              )}
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={referralDialogOpen} onOpenChange={setReferralDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Icon name="Users" size={24} className="text-accent" />
                Реферальная программа
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="bg-gradient-to-br from-accent/10 to-secondary/10 rounded-xl p-6 text-center space-y-3">
                <Icon name="Gift" size={48} className="mx-auto text-accent" />
                <h3 className="text-2xl font-bold">🎁 Приглашай и зарабатывай</h3>
                <p className="text-sm text-muted-foreground">
                  Получай 300₽ за каждого водителя, который оформит подписку по твоей ссылке
                </p>
              </div>

              <Card className="border-2 border-accent bg-white">
                <CardContent className="pt-6 space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">Твой реферальный код</label>
                    <div className="flex gap-2">
                      <Input
                        value={referralCode}
                        readOnly
                        className="text-center font-mono font-bold text-lg"
                      />
                      <Button
                        onClick={copyReferralCode}
                        variant="outline"
                        className="shrink-0"
                      >
                        <Icon name={copiedCode ? "Check" : "Copy"} size={18} />
                      </Button>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={shareReferralCode}
                      className="flex-1 bg-gradient-to-r from-accent to-secondary"
                    >
                      <Icon name="Share2" className="mr-2" size={18} />
                      Поделиться
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-green-500/10 to-green-600/10 border-2 border-green-500/30">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Всего заработано</p>
                      <p className="text-3xl font-bold text-green-600">{totalReferralBonus}₽</p>
                    </div>
                    <Icon name="TrendingUp" size={48} className="text-green-600/30" />
                  </div>
                  <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                    <Icon name="Users" size={14} />
                    <span>Приглашено: {referrals.length} водителей</span>
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-sm">Твои рефералы</h4>
                  <Badge className="bg-accent">{referrals.filter(r => r.status === 'active').length} активных</Badge>
                </div>
                
                <ScrollArea className="h-[240px] rounded-lg border">
                  <div className="space-y-2 p-3">
                    {referrals.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <Icon name="UserPlus" size={32} className="mx-auto mb-2 opacity-50" />
                        <p className="text-sm">Пригласи первого водителя</p>
                      </div>
                    ) : (
                      referrals.map((referral) => (
                        <Card key={referral.id} className="bg-muted/30">
                          <CardContent className="p-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-accent to-secondary flex items-center justify-center text-white font-bold">
                                  {referral.name.charAt(0)}
                                </div>
                                <div>
                                  <p className="font-medium text-sm">{referral.name}</p>
                                  <p className="text-xs text-muted-foreground">{referral.date}</p>
                                </div>
                              </div>
                              <div className="text-right">
                                {referral.status === 'active' ? (
                                  <>
                                    <p className="text-lg font-bold text-green-600">+{referral.bonus}₽</p>
                                    <Badge className="bg-green-500 text-white text-xs mt-1">
                                      <Icon name="CheckCircle2" size={10} className="mr-1" />
                                      Активен
                                    </Badge>
                                  </>
                                ) : (
                                  <Badge variant="outline" className="text-xs">
                                    <Icon name="Clock" size={10} className="mr-1" />
                                    Ожидание
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </div>

              <Card className="bg-gradient-to-r from-accent/5 to-secondary/5 border-2 border-accent/30">
                <CardContent className="pt-4">
                  <div className="space-y-2 text-sm">
                    <div className="flex items-start gap-2">
                      <Icon name="Info" size={16} className="text-accent mt-0.5 shrink-0" />
                      <div className="space-y-1">
                        <p className="font-medium">Как это работает?</p>
                        <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
                          <li>Поделись своим кодом с друзьями</li>
                          <li>Они регистрируются и оформляют подписку</li>
                          <li>Ты получаешь 300₽ за каждого</li>
                          <li>Бонусы можно использовать для оплаты подписки</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default Index;