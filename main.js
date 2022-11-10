const API_Key = "26b9805b5e9e8ac721dc686782e58f8a";

const DAYS_OF_WEEK = ["sun", "mon", "tue", "wed", "thur", "fri", "sat"];

let selectedCityText;
let selectedCity;

const dynamicContent = document.getElementById("dynamic-title");
const phrases = ["Sunrise", "Sunset"];

const getCityUsingGeoLocation = async (searchText) => {
  const response = await fetch(
    `https://api.openweathermap.org/geo/1.0/direct?q=${searchText}&limit=5&appid=${API_Key}`
  );
  return response.json();
};

const getWeatherInfo = async ({ lat, lon, name: city }) => {
  const url =
    lat && lon
      ? `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_Key}&units=metric`
      : `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${API_Key}&units=metric`;
  const response = await fetch(url);
  return response.json();
};

const getHourlyWeatherData = async ({ name: city }) => {
  const response = await fetch(
    `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${API_Key}&units=metric`
  );
  const data = await response.json();
  return data.list.map((forecast) => {
    const {
      main: { temp, temp_max, temp_min },
      dt,
      dt_txt,
      weather: [{ description, icon }],
    } = forecast;
    return { temp, temp_max, temp_min, dt, dt_txt, description, icon };
  });
};

const formatTemp = (temp) => `${temp?.toFixed(1)}°`;
const iconUrl = (icon) => `http://openweathermap.org/img/wn/${icon}@2x.png`;
const realTime = (time) => {
  const formatTime = new Date(time * 1000);
  mainTime = formatTime.toLocaleTimeString("en-BR");
  return mainTime;
};

const loadCurrentForecast = ({
  name,
  main: { temp, temp_max, temp_min },
  weather: [{ description }],
}) => {
  const currentForecastElement = document.querySelector(".Current");
  currentForecastElement.querySelector(".Cityname").textContent = name;
  currentForecastElement.querySelector(".temp").textContent = formatTemp(temp);
  currentForecastElement.querySelector(".desc").textContent = description;
  currentForecastElement.querySelector(
    ".High-low-temp"
  ).textContent = `H: ${formatTemp(temp_max)} L:${formatTemp(temp_min)}`;
};

const loadHourlyForecast = (
  { main: { temp: tempNow }, weather: [{ icon: iconNow }] },
  hourlyUpdate
) => {
  const timeFormat = Intl.DateTimeFormat("en", {
    hour12: true,
    hour: "numeric",
  });
  let dataFor12Hours = hourlyUpdate.slice(2, 14);
  const hourlyContainer = document.querySelector(".hourly-container");
  let innerHTMLString = `
  <article>
        <h3 class="time">Now</h3>
        <img src="${iconUrl(iconNow)} " alt="" class="icon" />
        <p class="hourly-temp">${formatTemp(tempNow)}</p>
      </article>`;

  for (let { temp, icon, dt_txt } of dataFor12Hours) {
    innerHTMLString += `<article>
        <h3 class="time">${timeFormat.format(new Date(dt_txt))}</h3>
        <img src="${iconUrl(icon)} " alt="" class="icon" />
        <p class="hourly-temp">${formatTemp(temp)}</p>
      </article>`;
  }
  hourlyContainer.innerHTML = innerHTMLString;
};

const calculateDayWiseForecast = (hourlyUpdate) => {
  let dayWiseForecast = new Map();
  for (let forecast of hourlyUpdate) {
    const [date] = forecast.dt_txt.split(" ");
    const dayOfTheWeek = DAYS_OF_WEEK[new Date(date).getDay()];
    console.log(dayOfTheWeek);
    if (dayWiseForecast.has(dayOfTheWeek)) {
      let forecastForTheDay = dayWiseForecast.get(dayOfTheWeek);
      forecastForTheDay.push(forecast);
      dayWiseForecast.set(dayOfTheWeek, forecastForTheDay);
    } else {
      dayWiseForecast.set(dayOfTheWeek, [forecast]);
    }
  }
  console.log(dayWiseForecast);
  for (let [key, value] of dayWiseForecast) {
    let minTemperatures = Math.min(...Array.from(value, (val) => val.temp_min));
    let maxTemperatures = Math.max(...Array.from(value, (val) => val.temp_max));

    dayWiseForecast.set(key, {
      temp_min: minTemperatures,
      temp_max: maxTemperatures,
      icon: value.find((v) => v.icon).icon,
    });
  }
  console.log(dayWiseForecast);
  return dayWiseForecast;
};
/* addingfiveday functionality */
const loadFiveDayForecast = (hourlyUpdate) => {
  console.log(hourlyUpdate);
  const dayWiseForecast = calculateDayWiseForecast(hourlyUpdate);
  const container = document.querySelector(".Five-day-container");
  let dayWiseInfo = "";
  Array.from(dayWiseForecast).map(
    ([day, { temp_max, temp_min, icon }], index) => {
      if (index < 5) {
        dayWiseInfo += `<article class="day-wise-forecast">
          <h2 class="day">${index === 0 ? "today" : day}</h2>
          <img src="${iconUrl(icon)}" alt="" class="icon" />
          <p class="min">${formatTemp(temp_min)}</p>
          <p class="max">${formatTemp(temp_max)}</p>
        </article>`;
      }
    }
  );
  container.innerHTML = dayWiseInfo;
};

const loadFeelsLike = ({ main: { feels_like } }) => {
  let container = document.querySelector(".feelslike");
  container.querySelector(".feelslike-temp").textContent =
    formatTemp(feels_like);
};
const loadHumidity = ({ main: { humidity } }) => {
  let container = document.querySelector(".humidity");
  container.querySelector(".Humidity").textContent = `${humidity}%`;
};

const loadSunTime = ({ dt, sys: { sunrise, sunset } }) => {
  const sunTime = document.querySelector(".Sunset");
  var dateTime = dt;
  const newTime = realTime(dateTime);
  if (newTime > realTime(sunset)) {
    sunTime.querySelector(".time").textContent = realTime(sunrise);
    dynamicContent.textContent += phrases[0];
  } else {
    sunTime.querySelector(".time").textContent = realTime(sunset);
    dynamicContent.textContent += phrases[1];
  }
};

const loadForecastUsingGeoLocation = () => {
  navigator.geolocation.getCurrentPosition(
    ({ coords }) => {
      const { latitude: lat, longitude: lon } = coords;
      selectedCity = { lat, lon };
      loadData();
    },
    (error) => console.log(error)
  );
};

const loadData = async () => {
  const currentWeatherInfo = await getWeatherInfo(selectedCity);
  loadCurrentForecast(currentWeatherInfo);

  const hourlyUpdate = await getHourlyWeatherData(currentWeatherInfo);
  loadHourlyForecast(currentWeatherInfo, hourlyUpdate);
  loadFeelsLike(currentWeatherInfo);
  loadHumidity(currentWeatherInfo);
  loadSunTime(currentWeatherInfo);
  loadFiveDayForecast(hourlyUpdate);
};

function debounce(func) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      func.apply(this, args);
    }, 500);
  };
}
const onSearch = async (event) => {
  let { value } = event.target;

  if (!value) {
    selectedCity = null;
    selectedCityText = "";
  }
  if (value && selectedCityText !== value) {
    const listOfCities = await getCityUsingGeoLocation(value);
    let options = "";
    for (let { lat, lon, name, state, country } of listOfCities) {
      options += `<option data-city-details='${JSON.stringify({
        lat,
        lon,
        name,
      })}' value="${name}, ${state}, ${country}"></option>`;
    }
    document.querySelector("#cities").innerHTML = options;
  }
};

const handleCitySelection = (event) => {
  selectedCityText = event.target.value;
  let options = document.querySelectorAll("#cities > option");
  if (options?.length) {
    let selectedOptions = Array.from(options).find(
      (opt) => opt.value === selectedCityText
    );
    selectedCity = JSON.parse(
      selectedOptions.getAttribute("data-city-details")
    );
    loadData();
  }
};

const debounceSearch = debounce((event) => onSearch(event));

document.addEventListener("DOMContentLoaded", async () => {
  loadForecastUsingGeoLocation();
  const searchInput = document.querySelector("#search");
  searchInput.addEventListener("input", debounceSearch);
  searchInput.addEventListener("change", handleCitySelection);
});
