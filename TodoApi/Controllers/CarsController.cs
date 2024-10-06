using CarStockApi.Models;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using System.Collections.Generic;
using System.Reflection.Metadata.Ecma335;
using System.Threading.Tasks;

namespace CarStockApi.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class CarsController : ControllerBase {
        private readonly CarRepository _carRepository;

        public CarsController(CarRepository carRepository) {
            
            _carRepository = carRepository;
        }

        [HttpGet]
        public async Task<ActionResult <IEnumerable<Car>>> GetCars()
        {
            try{
                var cars = await _carRepository.GetAllCarsAsync();

                if (cars == null || !cars.Any())
                {
                    return NotFound("No Cars found");
                }

                return Ok(cars);
            }
            catch (Exception ex){
                return StatusCode(500, $"Internal server error (get): {ex.Message}");
            }
        }

        [HttpPost]
        public async Task<ActionResult> InsertCar([FromBody] Car car)
        {
            try{
                await _carRepository.AddCarAsync(car);
                return CreatedAtAction(nameof(GetCars), car);
            }
            catch (Exception ex) {
                return StatusCode(500, $"Internal server error (insert): {ex.Message}");
            }
        }
    }
}
