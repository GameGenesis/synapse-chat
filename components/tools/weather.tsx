import { Card, CardContent } from "@/components/ui/card";
import Image from "next/image";

interface WeatherCardProps {
    weather: {
        location: {
            name: string;
            region: string;
            country: string;
        };
        current: {
            temp_c: number;
            temp_f: number;
            condition: {
                text: string;
                icon: string;
            };
            humidity: number;
            wind_kph: number;
            wind_dir: string;
        };
    };
}

const WeatherCard: React.FC<WeatherCardProps> = ({ weather }) => {
    return (
        <Card className="w-full">
            <CardContent className="p-4">
                <div className="flex items-start justify-between">
                    <div>
                        <h3 className="text-lg font-semibold mb-1">
                            {weather.location.name}, {weather.location.region}
                        </h3>
                        <p className="text-sm text-gray-500 mb-4">
                            {weather.location.country}
                        </p>
                        <div className="flex items-center">
                            <Image
                                src={`https:${weather.current.condition.icon}`}
                                alt={weather.current.condition.text}
                                width={64}
                                height={64}
                            />
                            <div className="ml-4">
                                <p className="text-3xl font-bold">
                                    {weather.current.temp_c}°C
                                </p>
                                <p className="text-sm text-gray-500">
                                    {weather.current.condition.text}
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="text-sm text-gray-600">
                            Humidity: {weather.current.humidity}%
                        </p>
                        <p className="text-sm text-gray-600">
                            Wind: {weather.current.wind_kph} km/h{" "}
                            {weather.current.wind_dir}
                        </p>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

export default WeatherCard;
