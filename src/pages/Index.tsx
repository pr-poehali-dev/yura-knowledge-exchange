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
type TariffType = 'economy' | 'comfort' | 'business';

interface ChatMessage {
  id: string;
  sender: 'user' | 'driver';
  text: string;
  time: string;
}

interface Order {
  id: string;
  from: string;
  to: string;
  status: OrderStatus;
  driverName?: string;
  carNumber?: string;
  arrivalTime?: number;
  tariff?: TariffType;
  price?: number;
  distance?: number;
  date?: string;
  time?: string;
  rating?: number;
  review?: string;
  driverRating?: number;
  driverLocation?: { lat: number; lng: number };
  userLocation?: { lat: number; lng: number };
}

interface Tariff {
  id: TariffType;
  name: string;
  icon: string;
  basePrice: number;
  perKm: number;
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
  const [selectedTariff, setSelectedTariff] = useState<TariffType>('economy');
  const [estimatedPrice, setEstimatedPrice] = useState<number | null>(null);
  const [orderHistory, setOrderHistory] = useState<Order[]>([]);

  const tariffs: Tariff[] = [
    {
      id: 'economy',
      name: 'Эконом',
      icon: 'Car',
      basePrice: 100,
      perKm: 15,
      description: 'Базовый тариф',
    },
    {
      id: 'comfort',
      name: 'Комфорт',
      icon: 'Sparkles',
      basePrice: 150,
      perKm: 25,
      description: 'Комфортные авто',
    },
    {
      id: 'business',
      name: 'Бизнес',
      icon: 'Crown',
      basePrice: 300,
      perKm: 45,
      description: 'Премиум класс',
    },
  ];

  const calculatePrice = (distance: number, tariff: TariffType): number => {
    const selectedTariffData = tariffs.find(t => t.id === tariff);
    if (!selectedTariffData) return 0;
    return selectedTariffData.basePrice + (distance * selectedTariffData.perKm);
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
    const price = calculatePrice(randomDistance, selectedTariff);
    setEstimatedPrice(price);
    toast({
      title: '💰 Расчёт стоимости',
      description: `~${randomDistance} км • ${price} ₽`,
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
    const calculatedPrice = calculatePrice(randomDistance, selectedTariff);

    const now = new Date();
    const newOrder: Order = {
      id: Date.now().toString(),
      from,
      to,
      status: 'searching',
      tariff: selectedTariff,
      price: calculatedPrice,
      distance: randomDistance,
      date: now.toLocaleDateString('ru-RU'),
      time: now.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
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
    { id: 'support', label: 'Поддержка', icon: 'MessageCircle' },
    { id: 'tariff', label: 'Тариф', icon: 'DollarSign' },
    { id: 'promo', label: 'Промокод', icon: 'Tag' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-accent/5 to-secondary/10">
      <div className="max-w-lg mx-auto p-4 space-y-4">
        <div className="pt-6 pb-4 animate-fade-in">
          <h1 className="text-4xl font-bold text-center bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
            TaxiGo
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
                    <Icon name="DollarSign" size={16} className="text-primary" />
                    Выберите тариф
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {tariffs.map((tariff) => (
                      <button
                        key={tariff.id}
                        onClick={() => setSelectedTariff(tariff.id)}
                        className={`p-3 rounded-xl border-2 transition-all hover:scale-105 ${
                          selectedTariff === tariff.id
                            ? 'border-primary bg-primary/10'
                            : 'border-border bg-background hover:border-primary/50'
                        }`}
                      >
                        <Icon
                          name={tariff.icon as any}
                          size={24}
                          className={selectedTariff === tariff.id ? 'text-primary mx-auto' : 'text-muted-foreground mx-auto'}
                        />
                        <p className={`text-xs font-semibold mt-1 ${selectedTariff === tariff.id ? 'text-primary' : 'text-foreground'}`}>
                          {tariff.name}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">от {tariff.basePrice}₽</p>
                      </button>
                    ))}
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
                  <div className="flex items-center justify-between pt-3 mt-3 border-t">
                    <div className="flex items-center gap-2">
                      <Icon name={tariffs.find(t => t.id === currentOrder.tariff)?.icon as any} size={18} className="text-primary" />
                      <span className="text-sm font-medium">{tariffs.find(t => t.id === currentOrder.tariff)?.name}</span>
                      <span className="text-xs text-muted-foreground">• {currentOrder.distance} км</span>
                    </div>
                    <div className="text-right">
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
                            <div className="flex items-center gap-2">
                              <Icon name={tariffs.find(t => t.id === order.tariff)?.icon as any} size={16} className="text-primary" />
                              <span className="text-xs font-medium">{tariffs.find(t => t.id === order.tariff)?.name}</span>
                              <span className="text-xs text-muted-foreground">• {order.distance} км</span>
                            </div>
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
                          {order.rating ? (
                            <div className="pt-2 border-t">
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
                              className="w-full mt-2"
                            >
                              <Icon name="Star" className="mr-2" size={14} />
                              Оценить поездку
                            </Button>
                          )}
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

        {role === 'driver' && (
          <div className="space-y-4 animate-fade-in">
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
                        <div className="flex items-center justify-between bg-accent/10 p-3 rounded-lg">
                          <div className="flex items-center gap-2">
                            <Icon name={tariffs.find(t => t.id === order.tariff)?.icon as any} size={16} className="text-accent" />
                            <span className="text-xs font-medium">{tariffs.find(t => t.id === order.tariff)?.name}</span>
                            <span className="text-xs text-muted-foreground">• {order.distance} км</span>
                          </div>
                          <span className="text-lg font-bold text-accent">{order.price}₽</span>
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
                            <div className="flex items-center gap-2">
                              <Icon name={tariffs.find(t => t.id === order.tariff)?.icon as any} size={16} className="text-secondary" />
                              <span className="text-xs font-medium">{tariffs.find(t => t.id === order.tariff)?.name}</span>
                              <span className="text-xs text-muted-foreground">• {order.distance} км</span>
                            </div>
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
                      onClick={() => setActiveSection(item.id)}
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
      </div>
    </div>
  );
};

export default Index;