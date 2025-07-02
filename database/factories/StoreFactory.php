<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

class StoreFactory extends Factory
{
    protected $model = \App\Models\Store::class;

    public function definition(): array
    {
        return [
            'name' => $this->faker->randomElement(['TV-', 'RSC-', 'SM-']) . $this->faker->company(),
            'dc' => $this->faker->word(),
            'dr_stamped' => $this->faker->date(),
            'area_size' => $this->faker->randomElement(['Small', 'Medium', 'Large']),
            'overstock' => $this->faker->word(),
            'ratbites' => $this->faker->word(),
            'closed' => $this->faker->boolean() ? 'Yes' : 'No',
            'no_diser' => $this->faker->word(),
            'class' => $this->faker->word(),
            'pullout_status' => $this->faker->word(),
            'dgcage_status' => $this->faker->word(),
            'tshirt_status' => $this->faker->word(),
            'litter_box_status' => $this->faker->word(),
            'pet_bed_status' => $this->faker->word(),
            'gondola_dep' => $this->faker->word(),
            'date_depo_refund' => $this->faker->date(),
            'missing_deliveries' => $this->faker->word(),
            'items_overstock' => $this->faker->word(),
            'po_or_limit' => $this->faker->word(),
            'items_not_allowed' => $this->faker->word(),
            'items_order' => $this->faker->word(),
            'others' => $this->faker->sentence(),
        ];
    }
} 