package com.example.happyplantandroid.data

import com.example.happyplantandroid.ui.PlantData
import com.influxdb.LogLevel
import com.influxdb.client.kotlin.InfluxDBClientKotlinFactory
import com.influxdb.query.dsl.Flux
import com.influxdb.query.dsl.functions.restriction.Restrictions
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.flow.consumeAsFlow
import timber.log.Timber
import java.time.temporal.ChronoUnit

class InfluxDbService {
    // You can generate an API token from the "API Tokens Tab" in the UI
    val token =
        "YOUR_INFLUXDB_TOKEN"
    val org = "Home"
    val bucket = "happyplant"


//    private val client = InfluxDBClientKotlinFactory
//        .create("http://192.168.1.177:8086", token.toCharArray(), org, bucket)

    // get most recent for location 0
//    private val fluxQuery = ("from(bucket: \"$bucket\")\n" +
//            "|> range(start: -1d)" +
//            "|> filter(fn: (r) => r[\"_measurement\"] == \"$measurement\")" +
//            "|> filter(fn: (r) => r[\"location\"] == \"0\")" +
//            "|> last()")

//    private val query = ("from(bucket: \"happyplant\")\n"
//            + "|> range(start: -90d)\n"
//            + "|> filter(fn: (r) => r[\"_measurement\"] == \"conditions\")\n"
//            + "|> last()")
//        """from(bucket: "happyplant")
//    |> range(start: -1d)
//    |> filter(fn: (r) => r["_measurement"] == "conditions")
//    """
//    |> pivot(rowKey: ["_time"], columnKey: ["_field"], valueColumn: "_value")
//    |> last()
//    |> drop(columns: ["_start", "_stop"])
//    """

    val query = """from(bucket: "happyplant")
  |> range(start: -1h)
  |> filter(fn: (r) => r["_measurement"] == "conditions")
  |> filter(fn: (r) => r["location"] == "bedroom" or r["location"] == "office" or r["location"] == "diningroom")
  |> filter(fn: (r) => r["_field"] == "humidity" or r["_field"] == "temperature")
  |> last()
"""


    @OptIn(ExperimentalCoroutinesApi::class)
    suspend fun getLatest(): List<PlantData> {
        val fluxQuery = Flux.from("happyplant")
            .range(-30L, ChronoUnit.MINUTES)
            .filter(Restrictions.and(Restrictions.measurement().equal("conditions")))

        // Result is returned as a stream
        val client = InfluxDBClientKotlinFactory.create(
            "http://192.168.1.177:8086",
            token.toCharArray(),
            org,
            bucket
        )

        client.setLogLevel(LogLevel.HEADERS)
        client.ping()

        Timber.i("\nSTART RESULTS\n")
        val results = client.getQueryKotlinApi().query(query)

        if (results.isEmpty) {
            Timber.i("\nEMPTY RESULTS\n")
            //return
        }

        val ret = mutableMapOf<String, PlantData>()

        Timber.i("\nCONSUMING RESULTS\n")
        results
            .consumeAsFlow()
            .collect {
                val currLocation = it.values["location"] as String
                val currModel = ret[currLocation] ?: PlantData(location = currLocation, "", "")
                when (it.values["_field"]) {
                    "humidity" -> currModel.humidity = (it.values["_value"] as Double).toString() + "%"
                    "temperature" -> currModel.temperature = (it.values["_value"] as Double).toString() + "°"
                }
                ret[currLocation] = currModel
                //Timber.i("HELLO LINE: $it")
                Timber.i("${it.values["location"]} ${it.values["_field"]} ${it.values["_value"]}")
            }

        Timber.i("\nCOMPLETE RESULTS\n")
        client.close()

        return ret.values.toList()
    }


}